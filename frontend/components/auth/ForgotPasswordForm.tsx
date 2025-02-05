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
import Link from "next/link";

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address",
  }),
  username: z.string().min(1, { message: "Username is required" }),
});

const ForgotPasswordForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [responseMessage, setResponseMessage] = useState<string | null>(null);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      username: "",
    },
  });

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true);

    try {
      const res = await fetch(
        "http://localhost:5000/api/auth/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      if (!res.ok) {
        const error = await res.json();

        form.setError("root", { message: error.msg });
        setIsLoading(false);
        return;
      }

      const result = await res.json();
      const resetToken = result.resetToken;

      router.push(`/auth/security-questions?token=${resetToken}`);
    } catch (err) {
      setResponseMessage(
        "An unexpected error occurred. Please try again later."
      );
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetButtonClick = () => {
    form.reset();
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Forgot Passsword</CardTitle>
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
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="grid gap-2">
                      <FormLabel className="text-xs font-medium -mb-2">
                        Email
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

                {form.formState.errors.root && (
                  <div className="mt-2 text-destructive">
                    <FormMessage>
                      {form.formState.errors.root.message}
                    </FormMessage>
                  </div>
                )}

                <div className="grid gap-4">
                  <Button type="submit" className="w-full">
                    {isLoading ? "Continuing..." : "Continue"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </CardHeader>
      </Card>
    </>
  );
};

export default ForgotPasswordForm;
