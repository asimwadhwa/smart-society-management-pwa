'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useComplaints } from '@/hooks/useComplaints';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function NewComplaintPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { createComplaint, uploadImage } = useComplaints();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<'idle' | 'uploading' | 'done'>('idle');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file (JPEG, PNG, etc.)',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Image must be less than 5MB',
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      toast({
        title: 'Description required',
        description: 'Please provide a description of your complaint',
        variant: 'destructive',
      });
      return;
    }

    if (description.trim().length < 20) {
      toast({
        title: 'Description too short',
        description: 'Please provide a more detailed description (at least 20 characters)',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    let imageUrl: string | undefined;

    try {
      // Upload image if selected
      if (selectedFile) {
        setUploadProgress('uploading');
        try {
          imageUrl = await uploadImage(selectedFile);
          setUploadProgress('done');
        } catch (uploadError: any) {
          toast({
            title: 'Image upload failed',
            description: uploadError.message || 'Failed to upload image. Submitting without image.',
            variant: 'destructive',
          });
          // Continue without image
        }
      }

      // Create complaint
      await createComplaint(description, imageUrl);

      toast({
        title: 'Complaint submitted!',
        description: 'Your complaint has been filed successfully.',
      });

      // Redirect to complaints list
      router.push('/complaints');
    } catch (error: any) {
      toast({
        title: 'Submission failed',
        description: error.message || 'Failed to submit complaint. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
      setUploadProgress('idle');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/complaints">
          <Button variant="ghost" size="sm">
            ← Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">File New Complaint</h1>
          <p className="text-gray-600 mt-1">Submit a new complaint to the management</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Complaint Details</CardTitle>
          <CardDescription>
            Please provide a detailed description of your issue. You can also attach an image if
            relevant.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your complaint in detail. Include the location, what the issue is, and when it started..."
                rows={5}
                className="resize-none"
                disabled={isSubmitting}
              />
              <p className="text-sm text-gray-500">
                {description.length} / 1000 characters (minimum 20)
              </p>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Attach Image (optional)</Label>
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-6">
                {previewUrl ? (
                  <div className="space-y-4">
                    <div className="relative w-full h-48 rounded-lg overflow-hidden">
                      <Image
                        src={previewUrl}
                        alt="Preview"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600 truncate">
                        {selectedFile?.name}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={removeImage}
                        disabled={isSubmitting}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center relative">
                    <span className="text-4xl mb-3 block">📷</span>
                    <p className="text-gray-600 mb-2">
                      Drag and drop an image or click to browse
                    </p>
                    <p className="text-sm text-gray-400">
                      PNG, JPG, GIF up to 5MB
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={isSubmitting}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-4"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isSubmitting}
                    >
                      Choose File
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Upload Progress */}
            {uploadProgress === 'uploading' && (
              <div className="flex items-center gap-2 text-blue-600">
                <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                <span className="text-sm">Uploading image...</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-3">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? (
                  <>
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                    Submitting...
                  </>
                ) : (
                  'Submit Complaint'
                )}
              </Button>
              <Link href="/complaints">
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Tips Card */}
      <Card className="max-w-2xl bg-blue-50 border-blue-100">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <span>💡</span> Tips for a faster resolution
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600 space-y-2">
          <p>• Be specific about the location (flat number, common area, etc.)</p>
          <p>• Describe when the issue started or was noticed</p>
          <p>• Include any relevant details that might help resolve the issue</p>
          <p>• Attach a clear photo if the issue is visible</p>
        </CardContent>
      </Card>
    </div>
  );
}
