"use client";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useGetMe, useLogOut } from "@/hook";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";

const Header = () => {
  const queryClient = useQueryClient();
  const routes = [
    { name: "Home", url: "/" },
    { name: "Problem", url: "/problems" },
    { name: "Assessment", url: "/assessment" },
    { name: "About us", url: "/about-us" },
    { name: "Contract", url: "/contract" },
  ];

  const { data, isLoading, isError } = useGetMe();
  const { mutate: logout } = useLogOut();
  console.log("data", data);
  console.log("data", data?.data);
  console.log("data", data?.data.data);
  const user = data?.data?.data
  console.log("isError", isError);

  const handleLogout = () => {
    logout(undefined, {
      onSuccess: (res) => {
        console.log(res);
        toast.add({
          title: "Tata",
          description: "Logout successfully",
          type: "success",
        });
        queryClient.removeQueries({ queryKey: ["user"] });
      },
      onError: (err) => {
        console.log(err);
        toast.add({
          title: "Logout error",
          description: err.message || "Someting went wrong.Please try again",
          type: "error",
        });
      },
    });
  };

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold">
          DevAssess
        </Link>

        {/* Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          {routes.map((route) => (
            <Link href={route.url} key={route.url}>
              {route.name}
            </Link>
          ))}
          {/* <Link
            href="/"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Home
          </Link>

          <Link
            href="/problems"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Problems
          </Link>

          <Link
            href="/assessments"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Assessments
          </Link>

          <Link
            href="/about"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            About
          </Link> */}
        </nav>

        {/* Auth */}
        <div>
          {!isLoading && !user && (
            <Button
              variant="outline"
              render={<Link href="/login">Login</Link>}
              nativeButton={false}
            >
              Login
            </Button>
          )}
          {!isLoading && data && (
            <Button onClick={handleLogout} variant="destructive">
              Logout
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
