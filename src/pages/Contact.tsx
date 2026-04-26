import { useState } from 'react';
import { z } from 'zod';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Phone, Mail, Send, Loader2, CheckCircle2, User, AtSign, Smartphone, MessageSquareText, Type, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Please enter your name')
    .max(80, 'Name must be under 80 characters'),
  email: z
    .string()
    .trim()
    .email('Please enter a valid email')
    .max(255, 'Email must be under 255 characters'),
  phone: z
    .string()
    .trim()
    .max(20, 'Phone must be under 20 characters')
    .optional()
    .or(z.literal('')),
  subject: z
    .string()
    .trim()
    .min(3, 'Please enter a subject')
    .max(120, 'Subject must be under 120 characters'),
  message: z
    .string()
    .trim()
    .min(10, 'Please share a little more detail (min 10 chars)')
    .max(2000, 'Message must be under 2000 characters'),
});

type FormErrors = Partial<Record<keyof z.infer<typeof contactSchema>, string>>;

const Contact = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [form, setForm] = useState({
    name: '',
    email: user?.email ?? '',
    phone: '',
    subject: '',
    message: '',
  });

  const handleChange = (key: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
    if (submitError) setSubmitError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const parsed = contactSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: FormErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FormErrors;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      const submissionId = crypto.randomUUID();
      const submittedAt = new Date().toISOString();
      const data = parsed.data;

      // Notify support inbox
      const notifyPromise = supabase.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'contact-support-notification',
          recipientEmail: 'supportmuffigoutapparelhub@gmail.com',
          // When support hits "Reply" in Gmail, the response goes
          // straight back to the customer instead of our own inbox.
          replyTo: data.email,
          idempotencyKey: `contact-notify-${submissionId}`,
          templateData: {
            customerName: data.name,
            customerEmail: data.email,
            customerPhone: data.phone || undefined,
            subject: data.subject,
            message: data.message,
            submittedAt,
          },
        },
      });

      // Acknowledge customer
      const ackPromise = supabase.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'contact-support-ack',
          recipientEmail: data.email,
          idempotencyKey: `contact-ack-${submissionId}`,
          templateData: {
            customerName: data.name,
            subject: data.subject,
            message: data.message,
          },
        },
      });

      const [notifyRes, ackRes] = await Promise.all([notifyPromise, ackPromise]);

      if (notifyRes.error) {
        throw new Error(notifyRes.error.message || 'Failed to deliver your message');
      }
      // Ack failure is non-blocking — log but don't error out.
      if (ackRes.error) {
        console.warn('Customer ack email failed:', ackRes.error);
      }

      setSubmitted(true);
      setForm({ name: '', email: user?.email ?? '', phone: '', subject: '', message: '' });
      toast({
        title: 'Message sent',
        description: 'We received your query. You\'ll hear back within 24 hours.',
      });
    } catch (err) {
      console.error('Contact submit failed:', err);
      const msg =
        err instanceof Error
          ? err.message
          : 'Please try again or call us directly at +91 91363 54192.';
      setSubmitError(msg);
      toast({
        title: 'Could not send your message',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-16 lg:py-24 max-w-3xl">
        <div className="text-center mb-12">
          <h1 className="font-serif text-3xl lg:text-4xl font-bold mb-3">
            Contact Us
          </h1>
          <p className="text-muted-foreground text-sm lg:text-base max-w-md mx-auto">
            We're here to help — pick the channel that suits you best.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {/* Phone */}
          <a
            href="tel:+919136354192"
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_hsl(var(--primary)/0.4)] hover:border-primary/40"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 group-hover:scale-110 transition-all duration-300">
              <Phone className="w-6 h-6 text-primary" strokeWidth={1.8} />
            </div>
            <span className="relative text-base font-semibold text-foreground mb-1">Phone</span>
            <span className="relative text-xs text-muted-foreground">+91 91363 54192</span>
          </a>

          {/* WhatsApp */}
          <a
            href="https://wa.me/919136354192?text=Hi!%20I%20have%20a%20query%20about%20Muffi%20Gout%20Apparel%20Hub."
            target="_blank"
            rel="noopener noreferrer"
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_hsl(142_70%_45%/0.4)] hover:border-[hsl(142_70%_45%/0.5)]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[hsl(142_70%_45%/0.08)] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative w-14 h-14 rounded-2xl bg-[hsl(142_70%_45%/0.12)] flex items-center justify-center mb-4 group-hover:bg-[hsl(142_70%_45%/0.18)] group-hover:scale-110 transition-all duration-300">
              <svg
                viewBox="0 0 24 24"
                width="24"
                height="24"
                fill="hsl(142 70% 40%)"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </div>
            <span className="relative text-base font-semibold text-foreground mb-1">WhatsApp</span>
            <span className="relative text-xs text-muted-foreground">Chat with us</span>
          </a>

          {/* Email */}
          <a
            href="mailto:supportmuffigoutapparelhub@gmail.com"
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_hsl(var(--accent)/0.4)] hover:border-accent/40"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative w-14 h-14 rounded-2xl bg-accent/15 flex items-center justify-center mb-4 group-hover:bg-accent/25 group-hover:scale-110 transition-all duration-300">
              <Mail className="w-6 h-6 text-accent-foreground" strokeWidth={1.8} />
            </div>
            <span className="relative text-base font-semibold text-foreground mb-1">Email</span>
            <span className="relative text-xs text-muted-foreground break-all px-1">support@muffigoutapparelhub.com</span>
          </a>
        </div>

        <div className="bg-gradient-to-br from-secondary/60 to-secondary/30 border border-border/50 rounded-2xl p-5 flex items-center justify-center gap-3 mb-12">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <div className="text-center">
            <p className="text-foreground font-semibold text-sm">
              Phone Support · Mon – Sat
            </p>
            <p className="text-muted-foreground text-xs mt-0.5">9:30 AM – 7:30 PM (IST)</p>
          </div>
        </div>

        <div className="bg-card border rounded-2xl p-6 lg:p-8 shadow-sm">
          <div className="mb-6">
            <h2 className="font-serif text-2xl font-bold mb-2">Send us a message</h2>
            <p className="text-sm text-muted-foreground">
              Fill in the form below and our support team will get back to you within
              24 hours.
            </p>
          </div>

          {submitted ? (
            <div className="flex flex-col items-center text-center py-10 space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="w-9 h-9 text-primary" strokeWidth={1.5} />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">Message sent!</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  We've sent you a confirmation email. Our team will reply within
                  24 hours.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setSubmitted(false)}
                className="rounded-full"
              >
                Send another message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact-name">Name</Label>
                  <Input
                    id="contact-name"
                    type="text"
                    autoComplete="name"
                    value={form.name}
                    onChange={handleChange('name')}
                    className={`h-12 bg-secondary/40 ${
                      errors.name ? 'border-destructive' : ''
                    }`}
                    placeholder="Your full name"
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact-email">Email</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={handleChange('email')}
                    className={`h-12 bg-secondary/40 ${
                      errors.email ? 'border-destructive' : ''
                    }`}
                    placeholder="you@example.com"
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-phone">
                  Phone <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="contact-phone"
                  type="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={handleChange('phone')}
                  className={`h-12 bg-secondary/40 ${
                    errors.phone ? 'border-destructive' : ''
                  }`}
                  placeholder="+91 ..."
                />
                {errors.phone && (
                  <p className="text-xs text-destructive">{errors.phone}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-subject">Subject</Label>
                <Input
                  id="contact-subject"
                  type="text"
                  value={form.subject}
                  onChange={handleChange('subject')}
                  className={`h-12 bg-secondary/40 ${
                    errors.subject ? 'border-destructive' : ''
                  }`}
                  placeholder="What is your query about?"
                />
                {errors.subject && (
                  <p className="text-xs text-destructive">{errors.subject}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-message">Message</Label>
                <Textarea
                  id="contact-message"
                  value={form.message}
                  onChange={handleChange('message')}
                  rows={6}
                  className={`bg-secondary/40 resize-none ${
                    errors.message ? 'border-destructive' : ''
                  }`}
                  placeholder="Share details about your query..."
                />
                <div className="flex items-center justify-between">
                  {errors.message ? (
                    <p className="text-xs text-destructive">{errors.message}</p>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Min 10 characters
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {form.message.length} / 2000
                  </span>
                </div>
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-12 rounded-full text-base font-semibold"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send message
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
