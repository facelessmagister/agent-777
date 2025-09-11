'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2, Plus, X } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export const novelFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().max(500).optional(),
  genre: z.array(z.string().min(1)).max(5, 'Maximum 5 genres allowed').optional(),
  status: z.enum(['draft', 'in_progress', 'completed', 'published']).default('draft'),
  coverImageUrl: z.string().url('Invalid URL').or(z.literal('')).optional(),
});

export type NovelFormValues = z.infer<typeof novelFormSchema>;

interface NovelFormProps {
  defaultValues?: Partial<NovelFormValues>;
  onSubmit: (data: NovelFormValues) => Promise<void>;
  submitButtonText?: string;
  submitButtonVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  isSubmitting?: boolean;
}


export function NovelForm({
  defaultValues,
  onSubmit,
  submitButtonText = 'Create Novel',
  submitButtonVariant = 'default',
}: NovelFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [genreInput, setGenreInput] = useState('');
  const router = useRouter();

  const form = useForm<NovelFormValues>({
    resolver: zodResolver(novelFormSchema) as any,
    defaultValues: {
      title: '',
      description: '',
      genre: [],
      status: 'draft',
      coverImageUrl: '',
      ...defaultValues,
    },
  });

  const { watch, setValue, getValues } = form;
  const genres = watch('genre') || [];

  const handleAddGenre = () => {
    const genre = genreInput.trim();
    if (genre && !genres.includes(genre)) {
      setValue('genre', [...genres, genre], { shouldValidate: true });
      setGenreInput('');
    }
  };

  const handleRemoveGenre = (genreToRemove: string) => {
    setValue(
      'genre',
      genres.filter((g) => g !== genreToRemove),
      { shouldValidate: true }
    );
  };

  const handleSubmit = async (data: NovelFormValues) => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      await onSubmit(data);
    } catch (error) {
      console.error('Form submission error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save novel. Please try again.';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error; // Re-throw to allow parent component to handle if needed
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit as any)} className="space-y-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter novel title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter a brief description of your novel"
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide a short description of your novel (max 500 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="genre"
              render={() => (
                <FormItem>
                  <FormLabel>Genres</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a genre"
                      value={genreInput}
                      onChange={(e) => setGenreInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddGenre();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleAddGenre}
                      disabled={!genreInput.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {genres.map((genre) => (
                      <div
                        key={genre}
                        className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-800"
                      >
                        {genre}
                        <button
                          type="button"
                          onClick={() => handleRemoveGenre(genre)}
                          className="rounded-full p-0.5 hover:bg-gray-200"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <FormDescription>Add up to 5 genres</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-6">
            <FormField
              control={form.control}
              name="status"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...field}
                  >
                    <option value="draft">Draft</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="published">Published</option>
                  </select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="coverImageUrl"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Cover Image URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/cover.jpg"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional. Provide a URL to a cover image for your novel.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {getValues('coverImageUrl') && (
              <div className="pt-2">
                <p className="text-sm font-medium mb-2">Cover Preview</p>
                <div className="relative aspect-[2/3] w-48 overflow-hidden rounded-md border">
                  <img
                    src={getValues('coverImageUrl')}
                    alt="Cover preview"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://via.placeholder.com/300x450?text=Cover+Not+Found';
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/novels')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            variant={submitButtonVariant}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              submitButtonText
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
