"use client";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import "react-datepicker/dist/react-datepicker.css";
import PasswordInput from "../PasswordInput";
import Link from "next/link";

const formSchema = z.object({
  username: z.string().min(1, { message: "Username is required" }),
  password: z.string().min(1, { message: "Password is required" }),
});

const LoginForm = () => {
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const loginUser = async (data: z.infer<typeof formSchema>) => {
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();

        form.setError("root", { message: error.msg });
        return;
      }

      const user = await res.json();
      localStorage.setItem("jwt", user.token);
      router.push("/");
    } catch (error) {
      form.setError("root", {
        message: "An unexpected error occurred. Please try again",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    await loginUser(data);
  };

  const handleResetButtonClick = () => {
    form.reset();
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Login</CardTitle>
            <Button
              type="button"
              className="text-center text-sm underline text-primary hover:text-primary/90 hover:bg-transparent bg-transparent shadow-none"
              onClick={handleResetButtonClick}
            >
              Reset
            </Button>
          </div>
          <CardContent className="pt-4">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="grid gap-6"
                encType="multipart/form-data"
              >
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem className="grid gap-2">
                      <FormLabel className="text-xs font-medium -mb-2">
                        Username
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="px-3 py-1 text-base shadow-sm border-input border rounded-md"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="grid gap-2">
                      <div className="flex justify-between items-center">
                        <FormLabel className="text-xs font-medium -mb-2">
                          Password
                        </FormLabel>
                        <Link
                          href="/auth/forgot-password"
                          className="text-center text-sm underline text-blue-600 hover:text-blue-800 visited:text-purple-600"
                        >
                          Forgot password?
                        </Link>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <PasswordInput {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.formState.errors.root && (
                  <div className="mt-2 text-destructive">
                    <FormMessage>
                      {form.formState.errors.root.message}
                    </FormMessage>
                  </div>
                )}

                <div className="grid gap-4">
                  <Button type="submit" className="w-full">
                    Login
                  </Button>

                  <Link
                    href="/auth/register"
                    className="text-center text-sm underline text-blue-600 hover:text-blue-800 visited:text-purple-600"
                  >
                    Create an account
                  </Link>
                </div>
              </form>
            </Form>
          </CardContent>
        </CardHeader>
      </Card>
    </>
  );
};

export default LoginForm;
