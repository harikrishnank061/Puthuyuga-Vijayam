'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/i18n';
import { createComplaint, createNotification } from '@/lib/db';
import { LocationPicker } from '@/components/location-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Mic, MicOff, Camera, Image as LucideImage, ClipboardList, FileText, MessageSquareText, LayoutGrid, Flag, Info, Navigation, Send, AlertTriangle } from 'lucide-react';

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

  const takePhoto = async () => {
    const currentCount = photos.length;
    if (currentCount >= 5) {
      setError(
        language === 'ta'
          ? 'அதிகபட்சமாக 5 புகைப்படங்களை மட்டுமே பதிவேற்ற முடியும்!'
          : 'You can only upload a maximum of 5 photos!'
      );
      return;
    }

    try {
      const { Camera, CameraResultType } = await import('@capacitor/camera');
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
      });

      if (image && image.base64String) {
        const compressedBase64 = `data:image/jpeg;base64,${image.base64String}`;
        setPhotos((prev) => [...prev, compressedBase64]);
      }
    } catch (err: any) {
      // Don't throw error if user cancelled the camera prompt
      if (err.message !== 'User cancelled photos app') {
        console.error('Camera Error:', err);
        setError(
          language === 'ta'
            ? `கேமரா மூலம் புகைப்படம் எடுப்பதில் தோல்வி: ${err.message}`
            : `Failed to capture photo from camera: ${err.message}`
        );
      }
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
    <Card className="w-full max-w-5xl mx-auto shadow-2xl border-primary/10 rounded-2xl overflow-hidden bg-white text-card-foreground">
      {/* Header styled with branding illustration banner on the right side */}
      <CardHeader 
        className="relative flex flex-row items-center justify-between p-4 sm:p-5 border-b border-[#C31F26]/10 text-left bg-cover bg-no-repeat bg-center"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(250, 244, 235, 0.96), rgba(250, 244, 235, 0.85)), url('/tcm.png')`
        }}
      >
        <div className="flex items-center gap-3 sm:gap-4 z-10 flex-1 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white border border-[#C31F26]/30 flex items-center justify-center shadow-sm flex-shrink-0">
            <ClipboardList className="h-5.5 w-5.5 sm:h-6 sm:w-6 text-[#C31F26] flex-shrink-0" />
          </div>
          <div className="flex-1 min-w-0 pr-2">
            <CardTitle className="text-lg sm:text-2xl font-extrabold text-[#6B1D1D] tracking-tight relative pb-1 flex flex-col items-start leading-none">
              {t('reportNewIssue')}
              <span className="w-12 h-1 bg-[#C31F26] mt-1 sm:mt-1.5 rounded-full"></span>
            </CardTitle>
            <CardDescription className="text-[10px] sm:text-sm text-[#8B3A3A]/90 font-semibold mt-1 leading-snug break-words">
              {language === 'ta'
                ? 'உங்கள் புகாரை வரைபட இருப்பிடத்துடன் சமர்ப்பிக்கவும்'
                : 'Submit your complaint with its exact location'}
            </CardDescription>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 rounded-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 hover:text-gray-900 shadow-sm z-10 flex items-center justify-center flex-shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="p-5 sm:p-6">
        {/* Permanent Warning Information Banner */}
        <div className="mb-5 p-3 sm:p-3.5 bg-[#FDF5E6] border border-[#FAE9C8] text-[#8B3A3A] rounded-xl text-sm flex items-center gap-2.5 text-left">
          <Info className="h-4.5 w-4.5 text-[#C31F26] flex-shrink-0" />
          <span className="font-semibold text-xs sm:text-sm">
            {language === 'ta' 
              ? 'உங்கள் புகாரைச் சமர்ப்பிக்க தேவையான அனைத்து விவரங்களையும் நிரப்பவும்.' 
              : 'Please fill in all required fields to submit your report.'}
          </span>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-semibold flex justify-between items-center text-left">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              {error}
            </span>
            <button type="button" onClick={() => setError('')} className="text-red-700 hover:opacity-85 font-bold">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Complaint Details Form */}
            <div className="lg:col-span-7 space-y-5 text-left">
              <div>
                <label className="text-sm font-bold text-[#6B1D1D] mb-1.5 flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-[#C31F26]" />
                  {t('issueTitleLabel')}
                </label>
                <Input
                  placeholder={t('issueTitlePlaceholder')}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-xl border-gray-200"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-sm font-bold text-[#6B1D1D] flex items-center gap-1.5">
                    <MessageSquareText className="h-4 w-4 text-[#C31F26]" />
                    {t('descriptionLabel')}
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={toggleListening}
                    className={`flex items-center gap-1.5 px-3 py-1 h-8 text-xs rounded-full border transition-all ${
                      isListening
                        ? 'bg-destructive/10 border-destructive text-destructive animate-pulse font-semibold'
                        : 'bg-[#FAF4EB]/40 hover:bg-[#FAF4EB]/70 border-[#C31F26]/20 text-[#C31F26]'
                    }`}
                  >
                    {isListening ? (
                      <>
                        <MicOff className="h-3.5 w-3.5 mr-0.5" />
                        {language === 'ta' ? 'பதிவு செய்வதை நிறுத்து...' : 'Stop Recording...'}
                      </>
                    ) : (
                      <>
                        <Mic className="h-3.5 w-3.5 mr-0.5 text-[#C31F26]" />
                        {language === 'ta' ? 'பேசி தட்டச்சு செய்க' : 'Speak to Type'}
                      </>
                    )}
                  </Button>
                </div>
                <div className="relative">
                  <textarea
                    placeholder={t('descriptionPlaceholder')}
                    value={form.description}
                    maxLength={500}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary min-h-[120px] bg-background text-foreground pr-1"
                    rows={4}
                  />
                  <div className="text-[10px] text-gray-400 font-mono text-right mt-1 pr-1">
                    {form.description.length} / 500
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-[#6B1D1D] mb-1.5 flex items-center gap-1.5">
                    <LayoutGrid className="h-4 w-4 text-[#C31F26]" />
                    {t('categoryLabel')}
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground h-10"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {t(cat as any)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-bold text-[#6B1D1D] mb-1.5 flex items-center gap-1.5">
                    <Flag className="h-4 w-4 text-[#C31F26]" />
                    {t('priorityLabel')}
                  </label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground h-10"
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
                <label className="text-sm font-bold text-[#6B1D1D] mb-1.5 flex items-center gap-1.5">
                  <Camera className="h-4 w-4 text-[#C31F26]" />
                  {t('addPhotosLabel')}
                </label>
                <div className="border-2 border-dashed border-gray-200 bg-[#FAF4EB]/10 rounded-2xl p-5 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={takePhoto}
                      className="flex-1 font-bold h-14 bg-[#FAF4EB]/30 border-[#C31F26]/20 hover:bg-[#FAF4EB]/60 text-[#C31F26] rounded-xl flex items-center justify-center gap-2.5 animate-none"
                    >
                      <Camera className="h-5 w-5 text-[#C31F26] flex-shrink-0" />
                      <div className="flex flex-col items-start leading-tight">
                        <span className="text-sm font-bold">{language === 'ta' ? 'படம் எடு' : 'Take Photo'}</span>
                        <span className="text-[10px] text-gray-400 font-medium">{language === 'ta' ? 'கேமரா மூலம்' : 'Using Camera'}</span>
                      </div>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 font-semibold h-14 border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl flex items-center justify-center gap-2.5"
                    >
                      <LucideImage className="h-5 w-5 text-gray-500 flex-shrink-0" />
                      <div className="flex flex-col items-start leading-tight">
                        <span className="text-sm font-semibold">{language === 'ta' ? 'கேலரியிலிருந்து எடு' : 'Choose from Gallery'}</span>
                        <span className="text-[10px] text-gray-400 font-medium">{language === 'ta' ? 'சாதனத்திலிருந்து பதிவேற்று' : 'Upload from device'}</span>
                      </div>
                    </Button>
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-3 flex items-center justify-center gap-1.5">
                    <Info className="h-3.5 w-3.5 text-[#C31F26]" />
                    {language === 'ta' ? 'நீங்கள் பல புகைப்படங்களைத் தேர்ந்தெடுக்கலாம் (அதிகபட்சம் 5)' : 'You can select multiple photos (Max 5)'}
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
                          <X className="h-3 w-3" />
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
          <div className="flex flex-col sm:flex-row gap-4 pt-5 border-t mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-full sm:flex-1 h-12 font-bold text-sm bg-[#FAF4EB]/30 border-gray-200 text-gray-700 hover:bg-[#FAF4EB]/60 rounded-xl"
            >
              {t('cancelBtn')}
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="w-full sm:flex-1 h-12 font-bold text-sm bg-[#C31F26] hover:bg-[#a0191f] text-white rounded-xl flex items-center justify-center gap-2"
            >
              <Send className="h-4 w-4 text-white" />
              {loading ? t('submittingText') : language === 'ta' ? 'புகாரைச் சமர்ப்பி' : 'Submit Report'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

