import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utiles/appError";
import {
  PaymentProvider,
  PaymentStatus,
} from "../../../../generated/prisma/enums";
import config from "../../config";
import { getBkashIdToken } from "../../lib/bkash";

// =========================
// CREATE PAYMENT
// =========================

const createPayment = async (assessmentId: string, userId: string) => {
  // Check assessment
  const assessment = await prisma.assessment.findFirst({
    where: {
      id: assessmentId,
      deletedAt: null,
    },
  });

  if (!assessment) {
    throw new AppError(httpStatus.NOT_FOUND, "Assessment not found");
  }

  // Free assessment
  if (assessment.price <= 0) {
    throw new AppError(httpStatus.BAD_REQUEST, "This assessment is free");
  }

  // Check already paid
  const existingPayment = await prisma.payment.findFirst({
    where: {
      userId,
      assessmentId,
      status: PaymentStatus.SUCCESS,
    },
  });

  if (existingPayment) {
    throw new AppError(
      httpStatus.CONFLICT,
      "Payment already completed for this assessment",
    );
  }

  // Create pending payment
  const payment = await prisma.payment.create({
    data: {
      amount: assessment.price,
      currency: "BDT",
      provider: PaymentProvider.BKASH,
      status: PaymentStatus.PENDING,
      userId,
      assessmentId,
    },
  });

  try {
    // Get bKash ID token
    const bkashIdToken = await getBkashIdToken();
    if (!bkashIdToken) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "bKash ID token not found",
      );
    }

    // Create bKash payment
    const bkashResponse = await fetch(
      `${config.bkash_base_url}/tokenized/checkout/create`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: bkashIdToken,
          "X-App-Key": config.bkash_app_key,
        },
        body: JSON.stringify({
          mode: "0011",
          payerReference: userId,
          callbackURL: config.bkash_callback_url,
          amount: assessment.price.toString(),
          currency: "BDT",
          intent: "sale",
          merchantInvoiceNumber: payment.id,
        }),
      },
    );

    const bkashResult = await bkashResponse.json();

    // bKash payment create failed
    if (!bkashResponse.ok || bkashResult.statusCode !== "0000") {
      await prisma.payment.update({
        where: {
          id: payment.id,
        },
        data: {
          status: PaymentStatus.FAILED,
          failedAt: new Date(),
        },
      });

      throw new AppError(
        httpStatus.BAD_REQUEST,
        bkashResult.statusMessage || "Failed to create bKash payment",
      );
    }

    // Save bKash paymentID
    await prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        providerPaymentId: bkashResult.paymentID,
      },
    });

    return {
      paymentId: payment.id,
      paymentUrl: bkashResult.bkashURL,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    await prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: PaymentStatus.FAILED,
        failedAt: new Date(),
      },
    });

    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to initiate bKash payment",
    );
  }
};

// =========================
// BKASH CALLBACK
// =========================

const handleBkashCallback = async (paymentID: string, status: string) => {
  if (!paymentID) {
    throw new AppError(httpStatus.BAD_REQUEST, "bKash payment ID is required");
  }

  // Find our payment using bKash paymentID
  const payment = await prisma.payment.findFirst({
    where: {
      providerPaymentId: paymentID,
    },
  });

  if (!payment) {
    throw new AppError(httpStatus.NOT_FOUND, "Payment record not found");
  }

  // =========================
  // CANCELLED
  // =========================

  if (status === "cancel") {
    const updatedPayment = await prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: PaymentStatus.CANCELLED,
      },
    });

    return {
      success: false,
      status: PaymentStatus.CANCELLED,
      message: "Payment cancelled by user",
      payment: updatedPayment,
    };
  }

  // =========================
  // FAILED
  // =========================

  if (status === "failure") {
    const updatedPayment = await prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: PaymentStatus.FAILED,
        failedAt: new Date(),
      },
    });

    return {
      success: false,
      status: PaymentStatus.FAILED,
      message: "Payment failed",
      payment: updatedPayment,
    };
  }

  // =========================
  // INVALID STATUS
  // =========================

  if (status !== "success") {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid bKash payment status");
  }

  // =========================
  // SUCCESS
  // =========================

  // Prevent duplicate callback
  if (payment.status === PaymentStatus.SUCCESS) {
    return {
      success: true,
      status: PaymentStatus.SUCCESS,
      message: "Payment already completed",
      transactionId: payment.transactionId,
    };
  }

  // Get bKash token
  const bkashIdToken = await getBkashIdToken();
  if (!bkashIdToken) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "bKash ID token not found",
    );
  }

  // Execute payment
  const bkashResponse = await fetch(
    `${config.bkash_base_url}/tokenized/checkout/execute`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: bkashIdToken,
        "X-App-Key": config.bkash_app_key,
      },
      body: JSON.stringify({
        paymentID,
      }),
    },
  );

  const bkashResult = await bkashResponse.json();

  // Execute failed
  if (!bkashResponse.ok || bkashResult.statusCode !== "0000") {
    await prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: PaymentStatus.FAILED,
        failedAt: new Date(),
      },
    });

    throw new AppError(
      httpStatus.BAD_REQUEST,
      bkashResult.statusMessage || "Failed to execute bKash payment",
    );
  }

  // Check amount
  const paidAmount = Number(bkashResult.amount);

  if (paidAmount !== payment.amount) {
    await prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: PaymentStatus.FAILED,
        failedAt: new Date(),
      },
    });

    throw new AppError(httpStatus.BAD_REQUEST, "Payment amount mismatch");
  }

  // Update payment as SUCCESS
  const updatedPayment = await prisma.payment.update({
    where: {
      id: payment.id,
    },
    data: {
      status: PaymentStatus.SUCCESS,
      transactionId: bkashResult.trxID,
      paidAt: new Date(),
    },
  });

  return {
    success: true,
    status: PaymentStatus.SUCCESS,
    message: "Payment completed successfully",
    payment: updatedPayment,
  };
};

export const paymentService = {
  createPayment,
  handleBkashCallback,
};
