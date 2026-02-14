import { useState } from "react";
import { useCreateAccount } from "@/hooks/use-accounts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertAccountSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const formSchema = insertAccountSchema.extend({
  spamSpeed: z.coerce.number().min(1000),
  catchSpeed: z.coerce.number().min(1000),
});

export function CreateAccountModal() {
  const [open, setOpen] = useState(false);
  const { mutate, isPending } = useCreateAccount();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      token: "",
      catchChannelId: "",
      spamChannelId: "",
      spamSpeed: 3000,
      catchSpeed: 2000,
      ownerIds: [],
      marketId: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    mutate(values, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/80 text-white font-bold tracking-wide shadow-[0_0_20px_rgba(124,58,237,0.4)] transition-all hover:scale-105">
          <Plus className="w-4 h-4 mr-2" />
          DEPLOY NEW UNIT
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-white/10 sm:max-w-[500px] text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-wider text-primary">INITIALIZE NEW ACCOUNT</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Account Designation (Name)</FormLabel>
                    <FormControl>
                      <Input placeholder="Unit-01" className="bg-black/30 border-white/10 focus:border-primary/50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="token"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Auth Token</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Discord Token" className="bg-black/30 border-white/10 focus:border-primary/50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="catchChannelId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catch Channel ID</FormLabel>
                    <FormControl>
                      <Input placeholder="123456..." className="bg-black/30 border-white/10 focus:border-primary/50 font-mono" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="spamChannelId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Spam Channel ID</FormLabel>
                    <FormControl>
                      <Input placeholder="123456..." className="bg-black/30 border-white/10 focus:border-primary/50 font-mono" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="spamSpeed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Spam Speed (ms)</FormLabel>
                    <FormControl>
                      <Input type="number" className="bg-black/30 border-white/10 focus:border-primary/50 font-mono" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="catchSpeed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catch Speed (ms)</FormLabel>
                    <FormControl>
                      <Input type="number" className="bg-black/30 border-white/10 focus:border-primary/50 font-mono" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" disabled={isPending} className="w-full bg-primary hover:bg-primary/80 mt-6">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              CONFIRM DEPLOYMENT
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
