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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { Calendar } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import PasswordInput from "../PasswordInput";
import { toast } from "sonner";

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address",
  }),
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
  firstName: z.string().min(1, {
    message: "First name is required",
  }),
  lastName: z.string().min(1, {
    message: "Last name is required",
  }),
  roleId: z
    .string({
      message: "Role is required",
    })
    .min(1, { message: "Role is required" }),
  profilePicture: z.string().optional(),
  securityQuestions: z
    .array(
      z.object({
        questionId: z.string().min(1, {
          message: "Security question is required",
        }),
        answer: z.string().min(1, {
          message: "Security question answer is required",
        }),
      })
    )
    .length(3, { message: "Exactly 3 security questions are required" }),
  address: z.string().min(1, {
    message: "Address is required",
  }),
  dateOfBirth: z.union([
    z
      .string({
        message: "Date of birth is required",
      })
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
      .transform((val) => new Date(val)),
    z.date(),
  ]),
});

interface SecurityQuestion {
  id: number;
  question: string;
}
interface Role {
  id: number;
  name: string;
}

const RegisterForm = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [securityQuestions, setSecurityQuestions] = useState<
    SecurityQuestion[]
  >([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchSecurityQuestions = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/auth/security-questions`
        );

        if (!res.ok) {
          console.error("Failed to fetch security questions");
          return;
        }

        const data = await res.json();
        setSecurityQuestions(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchSecurityQuestions();
  }, []);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/auth/roles`);

        if (!res.ok) {
          console.error("Failed to fetch roles");
          return;
        }

        const data = await res.json();
        setRoles(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchRoles();
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      dateOfBirth: undefined,
      address: "",
      email: "",
      password: "",
      roleId: "",
      profilePicture: "",
      securityQuestions: [
        { questionId: "", answer: "" },
        { questionId: "", answer: "" },
        { questionId: "", answer: "" },
      ],
    },
  });

  const registerUser = async (data: z.infer<typeof formSchema>) => {
    const newUser = {
      ...data,
      dateOfBirth: data.dateOfBirth.toISOString().split("T")[0],
    };

    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUser),
      });

      if (!res.ok) {
        const error = await res.json();
        console.log(error);
        if (
          error.msg.includes("Email is already in use. Please try another one")
        ) {
          form.setError("email", {
            type: "server",
            message: error.msg,
          });
        } else if (error.msg.includes("Duplicate security questions")) {
          form.setError("root", {
            type: "server",
            message: error.msg,
          });
        } else {
          form.setError("root", {
            type: "server",
            message: error.msg,
          });
        }
        return;
      }

      form.reset();
      const responseData = await res.json();
      return responseData;
    } catch (err) {
      console.error(err);
      form.setError("root", {
        type: "server",
        message: "An unexpected error occurred. Please try again",
      });
      throw err;
    }
  };

  // TODO: fix logic to push the route after the toast promise is resolved
  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    toast.promise(registerUser(data), {
      loading: "Sending request to admin...",
      success: (responseData) => {
        return responseData.msg;
      },
      error: (err) => {
        return err.message;
      },
      duration: 5000,
    });

    router.push("/auth/login");
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardContent className="pt-4">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="grid gap-6"
                encType="multipart/form-data"
              >
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem className="grid gap-2">
                      <FormLabel className="text-xs font-medium -mb-2">
                        First Name
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
                  name="lastName"
                  render={({ field }) => (
                    <FormItem className="grid gap-2">
                      <FormLabel className="text-xs font-medium -mb-2">
                        Last Name
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
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem className="grid gap-2">
                      <FormLabel className="text-xs font-medium -mb-2">
                        Date of birth
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DatePicker
                            wrapperClassName="w-full"
                            selected={
                              field.value ? new Date(field.value) : null
                            }
                            onChange={(date) => field.onChange(date)}
                            dateFormat="yyyy-MM-dd"
                            className="w-full px-3 py-1 text-base shadow-sm border-input border rounded-md"
                            showYearDropdown
                            yearDropdownItemNumber={100}
                            scrollableYearDropdown
                          />
                          <Calendar
                            className="absolute right-5 top-[7px]"
                            size={20}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="grid gap-2">
                      <FormLabel className="text-xs font-medium -mb-2">
                        Address
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
                  name="email"
                  render={({ field }) => (
                    <FormItem className="grid gap-2">
                      <FormLabel className="text-xs font-medium -mb-2">
                        Email
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="px-3 py-1 text-base shadow-sm border-input border rounded-md"
                          placeholder="m@example.com"
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
                      <FormLabel className="text-xs font-medium -mb-2">
                        Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <PasswordInput {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="profilePicture"
                  render={({ field }) => (
                    <FormItem className="grid gap-2">
                      <FormLabel className="text-xs font-medium -mb-2">
                        Profile picture (optional)
                      </FormLabel>
                      <FormControl>
                        <Input id="picture" type="file" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* TODO: Handle security questions */}
                {[0, 1, 2].map((index) => (
                  <div key={index}>
                    {/* Select for Security Question */}
                    <FormField
                      control={form.control}
                      name={`securityQuestions.${index}.questionId`}
                      render={({ field }) => (
                        <FormItem className="grid gap-2">
                          <FormLabel className="text-xs font-medium -mb-2">
                            {`Security Question ${index + 1}`}
                          </FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a security question" />
                              </SelectTrigger>
                              <SelectContent>
                                {securityQuestions.map((question) => (
                                  <SelectItem
                                    key={question.id}
                                    value={question.id.toString()}
                                  >
                                    {question.question}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="">
                      <FormField
                        control={form.control}
                        name={`securityQuestions.${index}.answer`}
                        render={({ field }) => (
                          <FormItem className="grid gap-2">
                            <FormLabel className="text-xs font-medium -mb-2 mt-4">
                              {`Answer for Question ${index + 1}`}
                            </FormLabel>
                            <FormControl>
                              <PasswordInput {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}

                <FormField
                  control={form.control}
                  name="roleId"
                  render={({ field }) => (
                    <FormItem className="grid gap-2">
                      <FormLabel className="text-xs font-medium -mb-2">
                        Select an account type
                      </FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Role" />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map((role) => (
                              <SelectItem key={role.id} value={String(role.id)}>
                                {role.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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

                <Button className="w-full">Send Request</Button>
              </form>
            </Form>
          </CardContent>
        </CardHeader>
      </Card>
    </>
  );
};

export default RegisterForm;
