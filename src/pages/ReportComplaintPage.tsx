import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ComplaintCategory, ComplaintPriority, Complaint } from '../types';
import {
  PlusCircle,
  MapPin,
  Camera,
  AlertCircle,
  CheckCircle2,
  Navigation,
  Loader2,
  ArrowRight,
  Info,
  X,
  Lock,
} from 'lucide-react';

interface ReportComplaintPageProps {
  navigate: (view: string, param?: string | number) => void;
  initialCategory?: string;
}

const CATEGORIES: ComplaintCategory[] = [
  'Road/Pothole',
  'Garbage',
  'Water Supply',
  'Drainage',
  'Streetlight',
  'Electricity',
  'Public Sanitation',
  'Other',
];

const PRIORITIES: ComplaintPriority[] = ['Low', 'Medium', 'High', 'Emergency'];

export const ReportComplaintPage: React.FC<ReportComplaintPageProps> = ({
  navigate,
  initialCategory,
}) => {
  const { isAuthenticated, user } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ComplaintCategory>(
    (initialCategory as ComplaintCategory) || 'Road/Pothole'
  );
  const [priority, setPriority] = useState<ComplaintPriority>('Medium');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submittedComplaint, setSubmittedComplaint] = useState<Complaint | null>(null);

  // Auto-suggest priority based on category/keywords
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setDescription(text);
    const lower = text.toLowerCase();
    if (
      lower.includes('live wire') ||
      lower.includes('sparking') ||
      lower.includes('burst pipe') ||
      lower.includes('flooding') ||
      lower.includes('open manhole')
    ) {
      setPriority('Emergency');
    } else if (category === 'Electricity' || category === 'Water Supply' || category === 'Drainage') {
      if (priority === 'Low') setPriority('High');
    }
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cat = e.target.value as ComplaintCategory;
    setCategory(cat);
    if (cat === 'Electricity' || cat === 'Water Supply') {
      setPriority('High');
    }
  };

  // GPS Location detection
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setDetectingGps(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(parseFloat(pos.coords.latitude.toFixed(6)));
        setLongitude(parseFloat(pos.coords.longitude.toFixed(6)));
        setDetectingGps(false);
      },
      (err) => {
        setDetectingGps(false);
        if (err.code === 1) {
          setGpsError('Location permission was denied. You can still type the street address manually.');
        } else {
          setGpsError('Unable to detect location. Please type the address manually.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Image Selection & Validation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormError(null);
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }

    const file = e.target.files[0];
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      setFormError('Invalid file format. Please upload a JPEG, PNG, or WebP photo.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFormError('Image size exceeds 5MB. Please upload a smaller photo.');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!isAuthenticated) {
      setFormError('Please sign in or register to submit a verified civic complaint.');
      return;
    }

    if (title.trim().length < 5) {
      setFormError('Complaint title must be at least 5 characters long.');
      return;
    }

    if (description.trim().length < 15) {
      setFormError('Detailed description must be at least 15 characters long.');
      return;
    }

    if (address.trim().length < 5) {
      setFormError('Please provide a specific street address or landmark (min 5 chars).');
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('category', category);
      formData.append('priority', priority);
      formData.append('address', address.trim());
      if (latitude !== null) formData.append('latitude', String(latitude));
      if (longitude !== null) formData.append('longitude', String(longitude));
      if (selectedFile) formData.append('image', selectedFile);

      const res = await api.complaints.submitComplaint(formData);
      if (res.success && res.complaint) {
        setSubmittedComplaint(res.complaint);
      } else {
        setFormError(res.message || 'Failed to submit complaint.');
      }
    } catch (err: any) {
      console.error('Submission error:', err);
      setFormError(err.message || 'An error occurred while saving the complaint to MySQL.');
    } finally {
      setSubmitting(false);
    }
  };

  // If successfully submitted, display confirmation view with actual database ID
  if (submittedComplaint) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-white rounded-2xl border border-emerald-200 p-8 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">
              Complaint Successfully Registered!
            </h2>
            <p className="text-xs text-slate-500">
              Your grievance has been permanently saved in the municipal database.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="text-xs text-slate-500">Unique Complaint ID:</span>
              <span className="text-lg font-mono font-bold text-blue-700">
                {submittedComplaint.complaint_code}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Subject:</span>
              <span className="font-medium text-slate-800">{submittedComplaint.title}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Category:</span>
              <span className="font-medium text-slate-800">{submittedComplaint.category}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Priority Level:</span>
              <span className="font-semibold text-amber-700">{submittedComplaint.priority}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Initial Status:</span>
              <span className="font-medium text-emerald-700">Submitted</span>
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Keep this reference code to track resolution progress on the public portal or in your personal dashboard.
          </p>

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              onClick={() => navigate('track', submittedComplaint.complaint_code)}
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <span>Track This Complaint</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => navigate('citizen-dashboard')}
              className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium text-xs cursor-pointer"
            >
              Go to My Dashboard
            </button>
            <button
              onClick={() => {
                setSubmittedComplaint(null);
                setTitle('');
                setDescription('');
                setAddress('');
                setSelectedFile(null);
                setImagePreview(null);
                setLatitude(null);
                setLongitude(null);
              }}
              className="px-4 py-2.5 rounded-lg text-slate-500 hover:text-slate-900 text-xs cursor-pointer"
            >
              Report Another Issue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
          <PlusCircle className="w-6 h-6 text-emerald-600" />
          <span>Report a Civic Problem</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Provide accurate details, address, and evidence to expedite municipal resolution.
        </p>
      </div>

      {/* Guest Notice */}
      {!isAuthenticated && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Authentication Required</p>
              <p className="text-amber-800 mt-0.5">
                You must be logged in as a registered citizen to register a verified complaint.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => navigate('login')}
              className="px-3 py-1.5 bg-amber-800 text-white font-medium rounded-lg hover:bg-amber-900 text-xs cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('register')}
              className="px-3 py-1.5 bg-white border border-amber-300 text-amber-900 font-medium rounded-lg hover:bg-amber-100 text-xs cursor-pointer"
            >
              Register
            </button>
          </div>
        </div>
      )}

      {/* Form Error Banner */}
      {formError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* Main Complaint Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-xs font-semibold text-slate-700 mb-1.5">
            Complaint Title <span className="text-rose-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            required
            placeholder="e.g. Broken streetlight on 4th Main Road, near Community Park"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-slate-900"
          />
          <span className="text-[11px] text-slate-400 mt-1 block">
            A concise headline summarizing the public issue.
          </span>
        </div>

        {/* Category & Priority Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="category" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Category <span className="text-rose-500">*</span>
            </label>
            <select
              id="category"
              value={category}
              onChange={handleCategoryChange}
              className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-slate-900 bg-white"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="priority" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Urgency / Priority Level <span className="text-rose-500">*</span>
            </label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as ComplaintPriority)}
              className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-slate-900 bg-white"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p} {p === 'Emergency' ? '⚠️ (Immediate Danger)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Detailed Description */}
        <div>
          <label htmlFor="description" className="block text-xs font-semibold text-slate-700 mb-1.5">
            Detailed Description <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="description"
            rows={4}
            required
            placeholder="Describe the problem in detail: when did it start, dimensions of damage, safety hazards to pedestrians or traffic..."
            value={description}
            onChange={handleDescriptionChange}
            className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-slate-900 leading-relaxed"
          />
          <span className="text-[11px] text-slate-400 mt-1 block">
            Minimum 15 characters. System automatically flags safety hazard keywords (e.g., live wire, open manhole).
          </span>
        </div>

        {/* Location & GPS */}
        <div className="space-y-3">
          <label htmlFor="address" className="block text-xs font-semibold text-slate-700">
            Location Address & Landmark <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              id="address"
              type="text"
              required
              placeholder="e.g. Sector 12, Opposite City Hospital, Main Ring Road"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 pl-9 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-slate-900"
            />
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>

          {/* GPS Coordinates Button */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="font-medium text-slate-800 flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-blue-600" />
                <span>GPS Coordinates (Optional)</span>
              </span>
              <p className="text-[11px] text-slate-500">
                {latitude !== null && longitude !== null ? (
                  <span className="font-mono text-emerald-700 font-medium">
                    Latitude: {latitude}, Longitude: {longitude}
                  </span>
                ) : (
                  'Helps field inspection teams navigate directly to the exact spot.'
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={handleDetectLocation}
              disabled={detectingGps}
              className="px-3 py-1.5 rounded-md bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-medium flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
            >
              {detectingGps ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  <span>Detecting...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-3.5 h-3.5 text-blue-600" />
                  <span>Detect My Location</span>
                </>
              )}
            </button>
          </div>

          {gpsError && (
            <div className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
              {gpsError}
            </div>
          )}
        </div>

        {/* Evidence Image Upload */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700">
            Evidence Photo Upload (JPEG, PNG, WebP &middot; Max 5MB)
          </label>

          {imagePreview ? (
            <div className="relative inline-block border border-slate-300 rounded-lg overflow-hidden group">
              <img
                src={imagePreview}
                alt="Complaint Evidence Preview"
                className="max-h-48 w-auto object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 p-1.5 bg-slate-900/80 hover:bg-rose-600 text-white rounded-full transition-colors cursor-pointer"
                title="Remove Image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-slate-50/50 hover:bg-blue-50/20">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <Camera className="w-5 h-5" />
              </div>
              <div className="text-center">
                <span className="text-xs font-medium text-blue-700">
                  Click to select photo evidence
                </span>
                <span className="text-xs text-slate-500"> or drag and drop</span>
              </div>
              <span className="text-[10px] text-slate-400">
                Visual proof significantly increases verification speed.
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-blue-600" />
            <span>Complaint code format: <strong>SC-2026-XXXXX</strong></span>
          </div>

          <button
            type="submit"
            disabled={submitting || !isAuthenticated}
            className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Recording in Database...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Submit Complaint</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
