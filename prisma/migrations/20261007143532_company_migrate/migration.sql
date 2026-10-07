-- CreateEnum
CREATE TYPE "CompanyStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "company_profiles" ADD COLUMN     "status" "CompanyStatus" NOT NULL DEFAULT 'PENDING';
