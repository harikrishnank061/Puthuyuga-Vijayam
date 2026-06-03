'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/i18n';
import { createComplaint, createNotification } from '@/lib/db';
import { LocationPicker } from '@/components/location-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const CATEGORIES = [
  'roads',
  'water',
  'sanitation',
  'electricity',
  'environment',
  'other',
];

const PRIORITIES = ['low', 'medium', 'high', 'critical'];

export function ReportIssueModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: () => void;
}) {
  const { currentCitizen } = useAuth();
  const { t, language } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'roads',
    priority: 'medium',
    latitude: 9.4515, // Default Rajapalayam center
    longitude: 77.5543,
    address: '',
  });

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError(
        language === 'ta'
          ? 'உங்கள் உலாவி குரல் தட்டச்சு அம்சத்தை ஆதரிக்கவில்லை. கூகுள் குரோம் பயன்படுத்துமாறு பரிந்துரைக்கிறோம்.'
          : 'Your browser does not support Speech Recognition. Please try Google Chrome or Microsoft Edge.'
      );
      return;
    }

    if (isListening) {
      const recognitionInstance = (globalThis as any)._speechRec;
      if (recognitionInstance) {
        recognitionInstance.stop();
      }
      setIsListening(false);
      return;
    }

    const descriptionBeforeSpeech = form.description || '';
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    // Set interimResults to true to allow real-time word-by-word streaming
    recognition.interimResults = true;
    
    // Set language: 'ta-IN' for Tamil, 'en-US' for English
    recognition.lang = language === 'ta' ? 'ta-IN' : 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      let speechSessionTranscript = '';
      
      // Process all speech blocks in the current recording session (both finalized and interim)
      for (let i = 0; i < event.results.length; ++i) {
        speechSessionTranscript += event.results[i][0].transcript;
      }

      const cleanSpeech = speechSessionTranscript.trim();
      if (cleanSpeech) {
        setForm((prev) => ({
          ...prev,
          description: descriptionBeforeSpeech 
            ? `${descriptionBeforeSpeech.trim()} ${cleanSpeech}` 
            : cleanSpeech
        }));
      }
    };

    (globalThis as any)._speechRec = recognition;
    recognition.start();
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const currentCount = photos.length;
      if (currentCount >= 5) {
        setError(
          language === 'ta'
            ? 'அதிகபட்சமாக 5 புகைப்படங்களை மட்டுமே பதிவேற்ற முடியும்!'
            : 'You can only upload a maximum of 5 photos!'
        );
        return;
      }

      const filesArray = Array.from(files);
      const remainingAllowed = 5 - currentCount;
      
      if (filesArray.length > remainingAllowed) {
        setError(
          language === 'ta'
            ? `நீங்கள் அதிகபட்சமாக 5 புகைப்படங்களை மட்டுமே பதிவேற்ற முடியும். மீதமுள்ள ${filesArray.length - remainingAllowed} புகைப்படங்கள் தவிர்க்கப்பட்டன.`
            : `You can only upload up to 5 photos. Skipping ${filesArray.length - remainingAllowed} extra photos.`
        );
      }

      filesArray.slice(0, remainingAllowed).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result;
          if (result) {
            // Compress image on the client-side to dramatically optimize upload speed and size
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const MAX_WIDTH = 1000;
              const MAX_HEIGHT = 1000;
              let width = img.width;
              let height = img.height;

              // Calculate new dimensions preserving aspect ratio
              if (width > height) {
                if (width > MAX_WIDTH) {
                  height *= MAX_WIDTH / width;
                  width = MAX_WIDTH;
                }
              } else {
                if (height > MAX_HEIGHT) {
                  width *= MAX_HEIGHT / height;
                  height = MAX_HEIGHT;
                }
              }

              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(img, 0, 0, width, height);
                // Convert to compressed jpeg format (typically yields ~50KB for 1000px width)
                const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
                setPhotos((prev) => [...prev, compressedBase64]);
              } else {
                setPhotos((prev) => [...prev, result as string]);
              }
            };
            img.src = result as string;
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLocationSelect = (lat: number, lng: number, address?: string) => {
    setForm((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      address: address || prev.address,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim() || !form.description.trim()) {
      setError(t('requiredField'));
      return;
    }

    if (form.latitude === 0 || form.longitude === 0) {
      setError(language === 'ta' ? 'வரைபடத்தில் ஒரு இருப்பிடத்தைத் தேர்ந்தெடுக்கவும்' : 'Please select a location on the map');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const complaintData = {
        citizenName: currentCitizen!.name,
        title: form.title,
        description: form.description,
        category: form.category,
        latitude: form.latitude,
        longitude: form.longitude,
        priority: form.priority as 'low' | 'medium' | 'high' | 'critical',
        photoUrls: photos,
      };

      const createdComplaint = await createComplaint(currentCitizen!.id, complaintData);
      await createNotification(
        createdComplaint.id,
        `New complaint: ${form.title}`,
        'assignment'
      );

      onSubmit();
    } catch (err: any) {
      setError(err.message || t('error'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-5xl mx-auto shadow-2xl border-primary/20 bg-card text-card-foreground">
      <CardHeader className="bg-primary text-primary-foreground rounded-t-lg flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-2xl font-bold">{t('reportNewIssue')}</CardTitle>
          <CardDescription className="text-primary-foreground/90">
            {language === 'ta'
              ? 'உங்கள் புகாரை வரைபட இருப்பிடத்துடன் சமர்ப்பிக்கவும்'
              : 'Submit your complaint with its map location'}
          </CardDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-primary-foreground hover:bg-primary/80"
        >
          ✕
        </Button>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-6">
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Complaint Details Form */}
            <div className="lg:col-span-7 space-y-5">
              <div>
                <label className="text-sm font-semibold mb-1.5 block">{t('issueTitleLabel')}</label>
                <Input
                  placeholder={t('issueTitlePlaceholder')}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-sm font-semibold block">{t('descriptionLabel')}</label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={toggleListening}
                    className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-full border transition-all ${
                      isListening
                        ? 'bg-destructive/10 border-destructive text-destructive animate-pulse font-semibold'
                        : 'hover:bg-accent hover:text-accent-foreground border-border text-muted-foreground bg-background'
                    }`}
                  >
                    {isListening 
                      ? (language === 'ta' ? '🛑 பதிவு செய்வதை நிறுத்து...' : '🛑 Stop Recording...') 
                      : (language === 'ta' ? '🎙️ பேசி தட்டச்சு செய்க' : '🎙️ Speak to Type')}
                  </Button>
                </div>
                <textarea
                  placeholder={t('descriptionPlaceholder')}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px] bg-background text-foreground"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold mb-1.5 block">{t('categoryLabel')}</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {t(cat as any)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold mb-1.5 block">{t('priorityLabel')}</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {t(p as any)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Photos Section Embedded Inline */}
              <div className="space-y-3 pt-2">
                <label className="text-sm font-semibold block">{t('addPhotosLabel')}</label>
                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center bg-accent/5">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    📷 {t('choosePhotosBtn')}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    {t('multiplePhotosAllowed')}
                  </p>
                </div>

                {photos.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative group rounded-md overflow-hidden border border-border">
                        <img
                          src={photo}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-20 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-90 hover:opacity-100"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Embedded Map Location Picker */}
            <div className="lg:col-span-5 border-t lg:border-t-0 lg:border-l border-border pt-6 lg:pt-0 lg:pl-8">
              <LocationPicker
                onLocationSelect={handleLocationSelect}
                initialLat={form.latitude}
                initialLng={form.longitude}
              />
            </div>
          </div>

          {/* Action buttons sitting at the bottom of the CardContent */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t mt-4">
            <Button type="button" variant="outline" onClick={onClose} className="w-full sm:flex-1 h-10 font-semibold text-xs sm:text-sm">
              {t('cancelBtn')}
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="w-full sm:flex-1 h-10 font-semibold text-xs sm:text-sm bg-primary text-primary-foreground hover:bg-primary/95"
            >
              {loading ? t('submittingText') : t('submitReportBtn')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
