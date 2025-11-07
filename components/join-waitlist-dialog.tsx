import { FC, useState } from "react";
import * as Yup from "yup";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoaderIcon, Instagram } from "lucide-react";
import Link from "next/link";

const waitlistSchema = Yup.object().shape({
  firstName: Yup.string().required("First name is required"),
  lastName: Yup.string().required("Last name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  social: Yup.string().required("Instagram handle is required"),
});

export const WaitlistDialog = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    social: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setErrors({});
    setSuccessMessage("");
    try {
      setIsSubmitting(true);
      await waitlistSchema.validate(formData, { abortEarly: false });

      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      setIsSubmitting(false);

      if (result.success) {
        setSuccessMessage("You've successfully joined the waitlist!");
        setFormData({ firstName: "", lastName: "", email: "", social: "" });
      } else {
        setErrors({ email: "Failed to join the waitlist. Please try again." });
      }
    } catch (err: any) {
      setIsSubmitting(false);
      if (err instanceof Yup.ValidationError) {
        const validationErrors: Record<string, string> = {};
        err.inner.forEach((e) => {
          if (e.path) validationErrors[e.path] = e.message;
        });
        setErrors(validationErrors);
      } else {
        setErrors({ email: "An unexpected error occurred. Try again." });
      }
    }
  };

  return (
    <div className="space-y-4">
      {!successMessage ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Input
              name="firstName"
              placeholder="First name"
              value={formData.firstName}
              onChange={handleChange}
            />
            <Input
              name="lastName"
              placeholder="Last name"
              value={formData.lastName}
              onChange={handleChange}
            />
          </div>
          <Input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
          />
          {errors.email && (
            <p className="text-red-400 text-sm">{errors.email}</p>
          )}
          <Input
            name="social"
            placeholder="Instagram"
            value={formData.social}
            onChange={(e) => {
              e.target.value = e.target.value.startsWith("@")
                ? e.target.value
                : `@${e.target.value}`;
              handleChange(e);
            }}
          />
          {errors.social && (
            <p className="text-red-400 text-sm">{errors.social}</p>
          )}
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {!isSubmitting ? "Submit" : <LoaderIcon className="animate-spin" />}
          </Button>
        </form>
      ) : (
        <div className="text-center space-y-2">
          <p>{successMessage}</p>
          <Link
            href="https://www.instagram.com/fframess.again"
            target="_blank"
            className="text-primary hover:underline inline-flex items-center gap-1"
          >
            <Instagram className="w-4 h-4" /> Follow us on Instagram
          </Link>
        </div>
      )}
    </div>
  );
};
