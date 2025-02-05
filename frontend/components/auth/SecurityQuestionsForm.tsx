"use client";
import { useState, useEffect } from "react";
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

const formSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string(),
        answer: z.string().min(1, {
          message: "Security question answer is required",
        }),
      })
    )
    .length(3, {
      message: "Exactly 3 security question answers are required",
    }),
});

interface SecurityQuestion {
  id: string;
  question: string;
}

const SecurityQuestionsForm = () => {
  const [securityQuestions, setSecurityQuestions] = useState<
    SecurityQuestion[]
  >([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      answers: [],
    },
  });

  useEffect(() => {
    const fetchSecurityQuestions = async () => {
      if (!token) return;

      try {
        const res = await fetch(
          `http://localhost:5000/api/users/security-questions?token=${token}`
        );

        if (!res.ok) {
          console.error("Failed to fetch security questions");
          return;
        }

        const data = await res.json();
        setSecurityQuestions(data);

        form.reset({
          answers: data.map(() => ({ answer: "" })),
        });
      } catch (err) {
        console.error(err);
      }
    };

    fetchSecurityQuestions();
  }, [token, form]);

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/users/security-questions/verify?token=${token}`,
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

      await res.json();
      router.push(`/auth/reset-password?token=${token}`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Answer security questions</CardTitle>
        <CardContent className="pt-4">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="grid gap-6"
              encType="multipart/form-data"
            >
              {securityQuestions.map((question, index) => (
                <div className="grid gap-2" key={question.id}>
                  <p>{`${index + 1}. ${question.question}`}</p>
                  <div>
                    <FormField
                      control={form.control}
                      name={`answers.${index}.answer`}
                      render={({ field }) => (
                        <FormItem className="grid gap-2">
                          <FormControl>
                            <PasswordInput {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <input
                      type="hidden"
                      {...form.register(`answers.${index}.questionId`)}
                      value={question.id}
                    />
                  </div>
                </div>
              ))}

              {form.formState.errors.root && (
                <div className="mt-2 text-destructive">
                  <FormMessage>
                    {form.formState.errors.root.message}
                  </FormMessage>
                </div>
              )}

              <Button className="w-full" onClick={() => form.formState.errors}>
                Continue
              </Button>
            </form>
          </Form>
        </CardContent>
      </CardHeader>
    </Card>
  );
};

export default SecurityQuestionsForm;
