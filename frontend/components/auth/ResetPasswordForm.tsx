"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import PasswordInput from "@/components/PasswordInput";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const formSchema = z.object({
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .regex(/^[A-Za-z]/, {
      message: "Password must start with a letter",
    })
    .regex(/[A-Za-z]/, {
      message: "Password must contain at least one letter",
    })
    .regex(/\d/, {
      message: "Password must contain at least one number",
    })
    .regex(/[^A-Za-z0-9]/, {
      message: "Password must contain at least one special character",
    }),
});

const ResetPasswordForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
    },
  });

  const resetPassword = async (data: z.infer<typeof formSchema>) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/auth/reset-password?token=${token}`,
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
        form.setError("root", {
          type: "server",
          message: error.msg,
        });
        return;
      }

      toast.promise(resetPassword(data), {
        loading: "Resetting password...",
        success: (responseData) => {
          return responseData.msg;
        },
        error: (err) => {
          return err.message;
        },
        duration: 5000,
      });

      form.reset();
      return await res.json();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    await resetPassword(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset Password</CardTitle>
        <CardContent className="pt-4">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="grid"
              encType="multipart/form-data"
            >
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <Label>New password</Label>
                    <FormControl>
                      <PasswordInput {...field} />
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

              <Button
                className="w-full mt-6"
                onClick={() => form.formState.errors}
              >
                Continue
              </Button>
            </form>
          </Form>
        </CardContent>
      </CardHeader>
    </Card>
  );
};

export default ResetPasswordForm;
