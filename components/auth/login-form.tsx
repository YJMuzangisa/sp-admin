'use client';

import React, { useState } from "react";
import { Formik, Form } from "formik";
import { Button } from "@nextui-org/button";
import FormikInput from "@/components/ui/input";
import { loginValidationSchema } from "@/lib/validation-schemas";
import { loginFormData } from "@/types/forms";
import { EyeSlashIcon, EyeIcon } from "@heroicons/react/24/solid";

interface LoginFormProps {
  error: string;
  loading: boolean;
  onSubmit: (formData: loginFormData) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ error, loading, onSubmit }) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const MemoizedFormikInput = React.memo(FormikInput);

  const toggleVisibility = () => setIsVisible((prev) => !prev);

  return (
    <>
      {error && (
        <div
          className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm"
          role="alert"
        >
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <Formik
        initialValues={{ email: "", password: "" }}
        validationSchema={loginValidationSchema}
        onSubmit={(values, { setSubmitting }) => {
          onSubmit(values);
          setSubmitting(false);
        }}
      >
        {({ isSubmitting }) => (
          <Form className="space-y-4">
            <MemoizedFormikInput
              isRequired
              name="email"
              label="Email"
              type="email"
              variant="bordered"
              classNames={{
                inputWrapper: "border-gray-200 hover:border-violet-300 focus-within:!border-violet-500",
                label: "text-gray-600",
              }}
            />
            <MemoizedFormikInput
              isRequired
              name="password"
              label="Password"
              type={isVisible ? "text" : "password"}
              variant="bordered"
              classNames={{
                inputWrapper: "border-gray-200 hover:border-violet-300 focus-within:!border-violet-500",
                label: "text-gray-600",
              }}
              endContent={
                <button
                  className="focus:outline-none text-gray-400 hover:text-violet-600 transition-colors"
                  type="button"
                  onClick={toggleVisibility}
                  aria-label="toggle password visibility"
                >
                  {isVisible ? (
                    <EyeSlashIcon className="w-5 h-5 pointer-events-none" />
                  ) : (
                    <EyeIcon className="w-5 h-5 pointer-events-none" />
                  )}
                </button>
              }
            />

            <div className="pt-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                isLoading={loading}
                fullWidth={true}
                className="bg-gradient-to-r from-violet-600 to-violet-700 text-white font-medium h-11 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all"
              >
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </>
  );
};

export default LoginForm;