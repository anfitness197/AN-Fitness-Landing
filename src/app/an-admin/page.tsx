"use client";

export const runtime = "edge";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, Save, Trash2, Edit2, X, Check, Upload, Image as ImageIcon, 
  Dumbbell, MessageSquare, ShieldAlert, Key, LogOut, Loader2, Sparkles, RefreshCw, Megaphone, Calendar, FileText, Bell, Send, CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface OfferCard {
  id: string;
  title: string;
  subtitle: string;
  price: string;
  badge: string;
  features: string | string[]; 
  whatsappText: string;
  active: number;
}

interface MembershipCard {
  id: string;
  name: string;
  price: number;
  billing: string;
  features: string | string[]; 
  popular: number;
  badge: string;
}

interface GalleryItem {
  id: string;
  url: string;
  category: string;
  title: string;
}

interface GymEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  posterUrl: string;
  category: string;
  type?: "event" | "notification";
  sendPush?: boolean;
}

interface UploadTask {
  id: string;
  file: File;
  preview: string;
  title: string;
  category: string;
  status: "idle" | "compressing" | "uploading" | "success" | "error";
  errorMsg?: string;
  originalSize?: number;
  compressedSize?: number;
}

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

const compressImage = async (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        const MAX_WIDTH = 1600;
        const MAX_HEIGHT = 1200;
        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context failed"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        const mimeType = "image/webp";
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
              const compressedFile = new File([blob], `${nameWithoutExt}.webp`, {
                type: mimeType,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error("Canvas blob creation failed"));
            }
          },
          mimeType,
          0.82
        );
      };
      img.onerror = () => reject(new Error("Image loading failed"));
    };
    reader.onerror = () => reject(new Error("FileReader failed"));
  });
};

const generateWhatsappMessage = (title: string, price: string, subtitle: string) => {
  const cleanTitle = title.trim();
  const cleanPrice = price.trim() === "₹" ? "" : price.trim();
  const cleanSubtitle = subtitle.trim();
  
  let msg = "Hi AN Fitness, I want to claim the offer";
  if (cleanTitle) {
    msg += `: ${cleanTitle}`;
  }
  if (cleanPrice) {
    msg += ` for ${cleanPrice}`;
  }
  if (cleanSubtitle) {
    msg += ` (${cleanSubtitle})`;
  }
  return msg;
};

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"offers" | "memberships" | "gallery" | "events" | "settings">("offers");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [username, setUsername] = useState("");

  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: "success" | "error" | "info" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const showMessage = (msg: string, isError = false) => {
    addToast(msg, isError ? "error" : "success");
  };

  const [offers, setOffers] = useState<OfferCard[]>([]);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [newOffer, setNewOffer] = useState<OfferCard | null>(null);
  const [isWhatsappDirty, setIsWhatsappDirty] = useState(false);

  const [memberships, setMemberships] = useState<MembershipCard[]>([]);
  const [editingMembershipId, setEditingMembershipId] = useState<string | null>(null);
  const [newMembership, setNewMembership] = useState<MembershipCard | null>(null);

  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [uploadCategory, setUploadCategory] = useState("strength");
  const [uploadTasks, setUploadTasks] = useState<UploadTask[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const [events, setEvents] = useState<GymEvent[]>([]);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [newEvent, setNewEvent] = useState<GymEvent | null>(null);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isUploadingPoster, setIsUploadingPoster] = useState(false);
  const [adminEventsFilter, setAdminEventsFilter] = useState<"all" | "event" | "notification">("all");
  const [showQuickPushForm, setShowQuickPushForm] = useState(false);

  
  const [pushStatus, setPushStatus] = useState<{ subscriberCount: number; vapidPublicKey: string; vapidSubject: string } | null>(null);
  const [isLoadingPush, setIsLoadingPush] = useState(false);
  const [pushTitle, setPushTitle] = useState("");
  const [pushMessage, setPushMessage] = useState("");
  const [pushImage, setPushImage] = useState("");
  const [pushUrl, setPushUrl] = useState("/events");
  const [pushType, setPushType] = useState<"event" | "notification">("notification");
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState({ success: "", error: "", loading: false });

  const [announcementBadge, setAnnouncementBadge] = useState("NEW");
  const [announcementText, setAnnouncementText] = useState("REFER 4 FRIENDS & GET 1 MONTH FREE!");
  const [announcementActive, setAnnouncementActive] = useState(true);
  const [isSavingAnnouncement, setIsSavingAnnouncement] = useState(false);

  const [isLoadingOffers, setIsLoadingOffers] = useState(false);
  const [isLoadingMemberships, setIsLoadingMemberships] = useState(false);
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.authenticated) {
          setIsAuthenticated(true);
          setUsername(data.username);
        } else {
          setIsAuthenticated(false);
          router.push("/an-admin/login");
        }
      } catch (err) {
        setIsAuthenticated(false);
        router.push("/an-admin/login");
      }
    }
    checkSession();
  }, [router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (activeTab === "offers") fetchOffers();
    if (activeTab === "memberships") fetchMemberships();
    if (activeTab === "gallery") fetchGallery();
    if (activeTab === "events") {
      fetchEvents();
      fetchPushStatus();
    }
    if (activeTab === "settings") fetchAnnouncement();
  }, [activeTab, isAuthenticated]);

  const fetchPushStatus = async () => {
    setIsLoadingPush(true);
    try {
      const res = await fetch("/api/push/send");
      const data = await res.json();
      if (res.ok) {
        setPushStatus(data);
      }
    } catch (err: any) {
      console.error("Failed to load push status:", err);
    } finally {
      setIsLoadingPush(false);
    }
  };

  const handleSendManualPush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pushTitle.trim() || !pushMessage.trim()) {
      addToast("Notification title and message content are required.", "error");
      return;
    }

    setIsBroadcasting(true);
    try {
      const res = await fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: pushTitle.trim(),
          message: pushMessage.trim(),
          image: pushImage.trim(),
          url: pushUrl.trim() || "/events",
          type: pushType,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Broadcast failed");

      addToast(data.message || "Push notification broadcasted successfully!", "success");
      setPushTitle("");
      setPushMessage("");
      setPushImage("");
      fetchPushStatus();
    } catch (err: any) {
      addToast(err.message || "Failed to broadcast notification", "error");
    } finally {
      setIsBroadcasting(false);
    }
  };

  const fetchAnnouncement = async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (res.ok) {
        setAnnouncementBadge(data.badge || "");
        setAnnouncementText(data.text || "");
        setAnnouncementActive(data.active === 1);
      }
    } catch {
      
    }
  };

  
  const fetchOffers = async () => {
    setIsLoadingOffers(true);
    try {
      const res = await fetch("/api/offers");
      const data = await res.json();
      if (res.ok) setOffers(data);
      else throw new Error(data.error);
    } catch (err: any) {
      showMessage(err.message || "Failed to load offers", true);
    } finally {
      setIsLoadingOffers(false);
    }
  };

  const handleSaveOffer = async (offer: OfferCard, isNew = false) => {
    try {
      
      let parsedFeatures = offer.features;
      if (typeof parsedFeatures === "string") {
        parsedFeatures = parsedFeatures.split("\n").map(f => f.trim()).filter(Boolean);
      }

      const payload = { ...offer, features: parsedFeatures };
      const endpoint = isNew ? "/api/offers" : `/api/offers/${offer.id}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save offer");

      showMessage(`Offer "${offer.title}" saved successfully!`);
      setEditingOfferId(null);
      setNewOffer(null);
      fetchOffers();
    } catch (err: any) {
      showMessage(err.message || "Failed to save offer", true);
    }
  };

  const handleDeleteOffer = async (id: string) => {
    if (!confirm("Are you sure you want to delete this offer card?")) return;
    try {
      const res = await fetch(`/api/offers/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete offer");

      showMessage("Offer deleted successfully!");
      fetchOffers();
    } catch (err: any) {
      showMessage(err.message || "Failed to delete offer", true);
    }
  };

  
  const fetchMemberships = async () => {
    setIsLoadingMemberships(true);
    try {
      const res = await fetch("/api/memberships");
      const data = await res.json();
      if (res.ok) setMemberships(data);
      else throw new Error(data.error);
    } catch (err: any) {
      showMessage(err.message || "Failed to load membership plans", true);
    } finally {
      setIsLoadingMemberships(false);
    }
  };

  const handleSaveMembership = async (membership: MembershipCard, isNew = false) => {
    try {
      let parsedFeatures = membership.features;
      if (typeof parsedFeatures === "string") {
        parsedFeatures = parsedFeatures.split("\n").map(f => f.trim()).filter(Boolean);
      }

      const payload = { ...membership, features: parsedFeatures };
      const endpoint = isNew ? "/api/memberships" : `/api/memberships/${membership.id}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save membership plan");

      showMessage(`Membership "${membership.name}" saved successfully!`);
      setEditingMembershipId(null);
      setNewMembership(null);
      fetchMemberships();
    } catch (err: any) {
      showMessage(err.message || "Failed to save membership plan", true);
    }
  };

  const handleDeleteMembership = async (id: string) => {
    if (!confirm("Are you sure you want to delete this membership plan?")) return;
    try {
      const res = await fetch(`/api/memberships/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete membership plan");

      showMessage("Membership plan deleted successfully!");
      fetchMemberships();
    } catch (err: any) {
      showMessage(err.message || "Failed to delete membership plan", true);
    }
  };

  
  const fetchGallery = async () => {
    setIsLoadingGallery(true);
    try {
      const res = await fetch("/api/gallery");
      const data = await res.json();
      if (res.ok) setGallery(data);
      else throw new Error(data.error);
    } catch (err: any) {
      showMessage(err.message || "Failed to load gallery images", true);
    } finally {
      setIsLoadingGallery(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newTasks: UploadTask[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const id = `${Date.now()}-${i}-${Math.random().toString(36).substring(2, 5)}`;
      const preview = URL.createObjectURL(file);
      
      const category = uploadCategory;
      const title = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");

      newTasks.push({
        id,
        file,
        preview,
        title,
        category,
        status: "compressing",
        originalSize: file.size,
      });
    }

    setUploadTasks((prev) => [...prev, ...newTasks]);

    for (const task of newTasks) {
      await new Promise((resolve) => setTimeout(resolve, 80));
      try {
        const compressed = await compressImage(task.file);

        if (compressed.size > 2 * 1024 * 1024) {
          setUploadTasks((prev) =>
            prev.map((t) =>
              t.id === task.id
                ? {
                    ...t,
                    status: "error",
                    errorMsg: "File too large (> 2MB)",
                    compressedSize: compressed.size,
                  }
                : t
            )
          );
          addToast("Something went wrong. Try uploading other images.", "error");
        } else {
          setUploadTasks((prev) =>
            prev.map((t) =>
              t.id === task.id
                ? {
                    ...t,
                    file: compressed,
                    preview: URL.createObjectURL(compressed),
                    status: "idle",
                    compressedSize: compressed.size,
                  }
                : t
            )
          );
        }
      } catch (err: any) {
        setUploadTasks((prev) =>
          prev.map((t) =>
            t.id === task.id
              ? {
                  ...t,
                  status: "error",
                  errorMsg: "Processing failed",
                }
              : t
          )
        );
        addToast("Something went wrong. Try uploading other images.", "error");
      }
    }
  };

  const handleRemoveTask = (id: string) => {
    setUploadTasks((prev) => {
      const task = prev.find((t) => t.id === id);
      if (task?.preview.startsWith("blob:")) {
        URL.revokeObjectURL(task.preview);
      }
      return prev.filter((t) => t.id !== id);
    });
  };

  const handleUploadGallery = async (e: React.FormEvent) => {
    e.preventDefault();

    const pendingTasks = uploadTasks.filter((t) => t.status === "idle");
    if (pendingTasks.length === 0) {
      addToast("No ready photos to upload.", "error");
      return;
    }

    setIsUploading(true);
    let successCount = 0;

    for (const task of pendingTasks) {
      setUploadTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: "uploading" } : t))
      );

      try {
        const uploadFormData = new FormData();
        uploadFormData.append("file", task.file);

        const uploadRes = await fetch("/api/admin/upload", {
          method: "POST",
          body: uploadFormData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || "Upload failed");

        const fileUrl = uploadData.url;
        const fileId = uploadData.key.replace("gallery-", "").split(".")[0];

        const saveRes = await fetch("/api/gallery", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: fileId,
            url: fileUrl,
            category: task.category,
            title: task.title || "Untitled Lift",
          }),
        });

        const saveData = await saveRes.json();
        if (!saveRes.ok) throw new Error(saveData.error || "Save failed");

        successCount++;
        setUploadTasks((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, status: "success" } : t))
        );
      } catch (err: any) {
        setUploadTasks((prev) =>
          prev.map((t) =>
            t.id === task.id
              ? { ...t, status: "error", errorMsg: "Upload failed" }
              : t
          )
        );
        addToast("Something went wrong. Try uploading other images.", "error");
      }
    }

    setIsUploading(false);

    if (successCount > 0) {
      addToast(`Uploaded ${successCount} photo(s) to gallery!`, "success");
      fetchGallery();
    }

    setTimeout(() => {
      setUploadTasks((prev) => {
        const successes = prev.filter((t) => t.status === "success");
        successes.forEach((t) => URL.revokeObjectURL(t.preview));
        return prev.filter((t) => t.status !== "success");
      });
    }, 2000);
  };

  const handleDeleteGallery = async (id: string) => {
    if (!confirm("Are you sure you want to delete this photo?")) return;
    try {
      const res = await fetch(`/api/gallery/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");

      addToast("Photo deleted from gallery.", "success");
      fetchGallery();
    } catch (err: any) {
      addToast(err.message || "Failed to delete photo", "error");
    }
  };

  
  const fetchEvents = async () => {
    setIsLoadingEvents(true);
    try {
      const res = await fetch("/api/events");
      const data = await res.json();
      if (res.ok && Array.isArray(data)) setEvents(data);
      else setEvents([]);
    } catch (err: any) {
      addToast(err.message || "Failed to load events", "error");
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const handleSaveEvent = async (eventData: GymEvent, isNew = false) => {
    if (!eventData.title?.trim() || !eventData.description?.trim()) {
      addToast("Event title and description text are required.", "error");
      return;
    }

    try {
      const endpoint = isNew ? "/api/events" : `/api/events/${eventData.id}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...eventData,
          title: eventData.title.trim(),
          description: eventData.description.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save event");

      addToast(`Event "${eventData.title}" saved successfully!`, "success");
      setEditingEventId(null);
      setNewEvent(null);
      fetchEvents();
    } catch (err: any) {
      addToast(err.message || "Failed to save event", "error");
    }
  };

  const handleDeleteEvent = async (id: string, title?: string, type?: string) => {
    const itemLabel = type === "notification" ? "notification" : "event";
    if (!confirm(`Are you sure you want to delete this ${itemLabel}${title ? `: "${title}"` : ""}?`)) return;
    try {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to delete ${itemLabel}`);

      addToast(`${itemLabel === "notification" ? "Notification" : "Event"} deleted successfully!`, "success");
      fetchEvents();
    } catch (err: any) {
      addToast(err.message || `Failed to delete ${itemLabel}`, "error");
    }
  };

  const handlePosterFileUpload = async (file: File, updateUrl: (url: string) => void) => {
    setIsUploadingPoster(true);
    try {
      const compressed = await compressImage(file);
      const formData = new FormData();
      formData.append("file", compressed);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Poster upload failed");

      updateUrl(data.url);
      addToast("Poster uploaded successfully!", "success");
    } catch (err: any) {
      addToast(err.message || "Poster upload failed", "error");
    } finally {
      setIsUploadingPoster(false);
    }
  };

  
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ success: "", error: "New passwords do not match.", loading: false });
      return;
    }

    setPasswordStatus({ success: "", error: "", loading: true });
    try {
      const res = await fetch("/api/auth/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Password change failed");

      setPasswordStatus({ success: "Password changed successfully!", error: "", loading: false });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordStatus({ success: "", error: err.message || "Failed to update password.", loading: false });
    }
  };

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementText.trim()) {
      addToast("Announcement text is required.", "error");
      return;
    }

    setIsSavingAnnouncement(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          badge: announcementBadge,
          text: announcementText,
          active: announcementActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save announcement");

      addToast("Announcement banner updated successfully!", "success");
    } catch (err: any) {
      addToast("Something went wrong. Try uploading other images.", "error");
    } finally {
      setIsSavingAnnouncement(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/an-admin/login");
      router.refresh();
    } catch (err) {
      router.push("/an-admin/login");
    }
  };

  
  const getFeaturesArray = (features: any): string[] => {
    if (Array.isArray(features)) return features;
    if (typeof features === "string") {
      try {
        const parsed = JSON.parse(features);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        
        return features.split("\n").map(f => f.trim()).filter(Boolean);
      }
    }
    return [];
  };

  const getFeaturesString = (features: any): string => {
    if (Array.isArray(features)) return features.join("\n");
    if (typeof features === "string") {
      try {
        const parsed = JSON.parse(features);
        if (Array.isArray(parsed)) return parsed.join("\n");
      } catch (e) {
        return features;
      }
    }
    return "";
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white">
        <Loader2 size={32} className="animate-spin text-brandRed mb-4" />
        <span className="text-xs uppercase tracking-widest font-mono text-zinc-500">Checking credentials...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col md:flex-row">

      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-zinc-900 bg-zinc-950/60 backdrop-blur-md flex flex-col shrink-0">

        <div className="p-6 border-b border-zinc-900">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-brandRed animate-pulse shadow-[0_0_8px_#D61A1F]" />
            <h2 className="font-heading font-black tracking-widest text-lg uppercase">AN FITNESS</h2>
          </div>
          <span className="text-[9px] text-zinc-500 font-mono tracking-widest uppercase mt-1 block">ADMIN CONSOLE</span>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-1.5">
          <button
            onClick={() => setActiveTab("offers")}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-3 cursor-pointer ${
              activeTab === "offers" 
                ? "bg-brandRed text-white shadow-lg shadow-brandRed/20" 
                : "text-zinc-400 hover:text-white hover:bg-zinc-900/50"
            }`}
          >
            <Sparkles size={16} />
            Special Offers
          </button>
          <button
            onClick={() => setActiveTab("memberships")}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-3 cursor-pointer ${
              activeTab === "memberships" 
                ? "bg-brandRed text-white shadow-lg shadow-brandRed/20" 
                : "text-zinc-400 hover:text-white hover:bg-zinc-900/50"
            }`}
          >
            <Dumbbell size={16} />
            Memberships
          </button>
          <button
            onClick={() => setActiveTab("gallery")}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-3 cursor-pointer ${
              activeTab === "gallery" 
                ? "bg-brandRed text-white shadow-lg shadow-brandRed/20" 
                : "text-zinc-400 hover:text-white hover:bg-zinc-900/50"
            }`}
          >
            <ImageIcon size={16} />
            Gallery
          </button>
          <button
            onClick={() => setActiveTab("events")}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-3 cursor-pointer ${
              activeTab === "events" 
                ? "bg-brandRed text-white shadow-lg shadow-brandRed/20" 
                : "text-zinc-400 hover:text-white hover:bg-zinc-900/50"
            }`}
          >
            <Calendar size={16} />
            Events & Notifications
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-3 cursor-pointer ${
              activeTab === "settings" 
                ? "bg-brandRed text-white shadow-lg shadow-brandRed/20" 
                : "text-zinc-400 hover:text-white hover:bg-zinc-900/50"
            }`}
          >
            <Key size={16} />
            Change Password
          </button>
        </nav>

        <div className="p-4 border-t border-zinc-900 bg-zinc-950/90 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-500 font-mono">Logged in as</span>
            <span className="text-xs font-bold text-white max-w-[120px] truncate">{username}</span>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-brandRed hover:border-brandRed text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Log Out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-10 max-h-screen overflow-y-auto relative bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(63,0,2,0.15),rgba(255,255,255,0))]">

        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm pointer-events-none">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              onClick={() => removeToast(toast.id)}
              className={cn(
                "pointer-events-auto cursor-pointer p-4 rounded-xl border shadow-2xl flex items-center gap-3 animate-slideIn transition-all hover:scale-102",
                toast.type === "error"
                  ? "bg-zinc-950 border-brandRed/30 text-brandRed-light"
                  : toast.type === "info"
                  ? "bg-zinc-950 border-blue-500/30 text-blue-400"
                  : "bg-zinc-950 border-emerald-500/30 text-emerald-400"
              )}
            >
              <span className={cn(
                "w-2 h-2 rounded-full shrink-0",
                toast.type === "error"
                  ? "bg-brandRed animate-pulse"
                  : toast.type === "info"
                  ? "bg-blue-500"
                  : "bg-emerald-500 animate-ping"
              )} />
              <span className="text-[11px] font-medium leading-relaxed">{toast.message}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeToast(toast.id);
                }}
                className="ml-auto text-zinc-600 hover:text-white transition-colors"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>

        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="font-heading font-black text-2xl md:text-3xl text-white uppercase tracking-tight animate-fade-in">
              {activeTab === "offers" && "MANAGE SPECIAL OFFERS"}
              {activeTab === "memberships" && "MANAGE MEMBERSHIP PLANS"}
              {activeTab === "gallery" && "MANAGE GYM GALLERY"}
              {activeTab === "settings" && "SECURITY SETTINGS"}
            </h1>
            <p className="text-zinc-500 text-xs mt-1">
              {activeTab === "offers" && "Update homepage slider campaigns claimed via WhatsApp"}
              {activeTab === "memberships" && "Update pricing grid options shown on memberships page"}
              {activeTab === "gallery" && "Upload and delete photos in your gym gallery"}
              {activeTab === "settings" && "Configure passwords and admin session boundaries"}
            </p>
          </div>

          {activeTab === "offers" && !newOffer && (
            <button
              onClick={() => {
                setNewOffer({
                  id: `offer-${Date.now()}`,
                  title: "",
                  subtitle: "2 Persons Access",
                  price: "₹",
                  badge: "",
                  features: "",
                  whatsappText: "Hi AN Fitness, I want to claim the offer",
                  active: 1
                });
                setIsWhatsappDirty(false);
              }}
              className="flex items-center gap-2 bg-brandRed hover:bg-brandRed-light text-white font-black tracking-widest text-xs uppercase px-4 py-3 rounded-xl shadow-lg shadow-brandRed/20 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus size={14} />
              ADD NEW OFFER CARD
            </button>
          )}

          {activeTab === "memberships" && !newMembership && (
            <button
              onClick={() => setNewMembership({
                id: `plan-${Date.now()}`,
                name: "",
                price: 0,
                billing: "/ month",
                features: "",
                popular: 0,
                badge: ""
              })}
              className="flex items-center gap-2 bg-brandRed hover:bg-brandRed-light text-white font-black tracking-widest text-xs uppercase px-4 py-3 rounded-xl shadow-lg shadow-brandRed/20 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus size={14} />
              ADD MEMBERSHIP PLAN
            </button>
          )}
        </header>

        <div className="w-full">

          {activeTab === "offers" && (
            <div className="flex flex-col gap-8">

              <div className="bg-zinc-900/10 border border-zinc-900 rounded-3xl p-6 sm:p-8 backdrop-blur-sm">
                <h3 className="font-heading font-black text-lg text-white uppercase tracking-tight mb-6 flex items-center gap-3">
                  <Megaphone className="text-brandRed" size={20} />
                  HOMEPAGE ANNOUNCEMENT BANNER
                </h3>

                <form onSubmit={handleSaveAnnouncement} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-widest pl-1">
                      Badge Text (e.g. NEW, OFFER)
                    </label>
                    <input
                      type="text"
                      value={announcementBadge}
                      onChange={(e) => setAnnouncementBadge(e.target.value.toUpperCase())}
                      placeholder="NEW"
                      className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-brandRed text-white px-4 py-3 rounded-xl text-xs placeholder-zinc-700 outline-none transition-all duration-300"
                      disabled={isSavingAnnouncement}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-widest pl-1">
                      Banner Announcement Text
                    </label>
                    <input
                      type="text"
                      value={announcementText}
                      onChange={(e) => setAnnouncementText(e.target.value)}
                      placeholder="REFER 4 FRIENDS & GET 1 MONTH FREE!"
                      className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-brandRed text-white px-4 py-3 rounded-xl text-xs placeholder-zinc-700 outline-none transition-all duration-300"
                      required
                      disabled={isSavingAnnouncement}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer group/check select-none py-2 shrink-0">
                      <input
                        type="checkbox"
                        checked={announcementActive}
                        onChange={(e) => setAnnouncementActive(e.target.checked)}
                        className="sr-only"
                        disabled={isSavingAnnouncement}
                      />
                      <div className={`w-4 h-4 rounded border transition-colors flex items-center justify-center ${announcementActive ? 'bg-brandRed border-brandRed' : 'border-zinc-800 bg-zinc-950/80 group-hover/check:border-zinc-700'}`}>
                        {announcementActive && (
                          <svg className="w-2.5 h-2.5 text-white fill-current" viewBox="0 0 24 24">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                          </svg>
                        )}
                      </div>
                      <span className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-widest group-hover/check:text-zinc-300 transition-colors">
                        Show Banner
                      </span>
                    </label>

                    <button
                      type="submit"
                      disabled={isSavingAnnouncement}
                      className="flex-1 flex items-center justify-center gap-2 bg-brandRed hover:bg-brandRed-light disabled:bg-zinc-850 text-white font-black tracking-widest text-xs uppercase py-3 rounded-xl shadow-lg transition-all cursor-pointer"
                    >
                      {isSavingAnnouncement ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          SAVING...
                        </>
                      ) : (
                        <>
                          SAVE BANNER
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {(newOffer || offers.length === 0) && (
                <div className="border border-dashed border-zinc-800 rounded-3xl p-6 bg-zinc-900/10">
                  <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-6 pl-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brandRed" />
                    {newOffer ? "Creating New Offer Card" : "No Offers Present. Create one now."}
                  </h3>
                  
                  {newOffer ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

                      <div className="relative bg-zinc-900/40 border-2 border-brandRed/40 rounded-3xl p-8 sm:p-10 bg-gradient-to-b from-zinc-900/50 to-transparent backdrop-blur-sm shadow-2xl flex flex-col justify-between min-h-[350px]">
                        <div>

                          <div className="mb-4">
                            <input
                              type="text"
                              value={newOffer.badge}
                              onChange={(e) => setNewOffer({ ...newOffer, badge: e.target.value.toUpperCase() })}
                              placeholder="BADGE (e.g. MONSOON SPECIAL)"
                              className="bg-zinc-950 border border-zinc-800 focus:border-brandRed text-[9px] font-mono tracking-widest text-brandRed bg-brandRed/5 px-3 py-1.5 rounded-md uppercase placeholder-zinc-700 outline-none w-full"
                            />
                          </div>

                          <div className="mb-4">
                            <input
                              type="text"
                              value={newOffer.title}
                              onChange={(e) => {
                                const val = e.target.value;
                                const updated = { ...newOffer, title: val };
                                if (!isWhatsappDirty) {
                                  updated.whatsappText = generateWhatsappMessage(val, newOffer.price, newOffer.subtitle);
                                }
                                setNewOffer(updated);
                              }}
                              placeholder="CARD TITLE (e.g. 6 MONTHS + 2 FREE)"
                              className="bg-zinc-950 border border-zinc-800 focus:border-brandRed text-sm sm:text-base font-black text-white placeholder-zinc-700 rounded-md outline-none w-full px-3 py-2 uppercase"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <input
                              type="text"
                              value={newOffer.price}
                              onChange={(e) => {
                                const val = e.target.value;
                                const updated = { ...newOffer, price: val };
                                if (!isWhatsappDirty) {
                                  updated.whatsappText = generateWhatsappMessage(newOffer.title, val, newOffer.subtitle);
                                }
                                setNewOffer(updated);
                              }}
                              placeholder="PRICE (e.g. ₹12,000)"
                              className="bg-zinc-950 border border-zinc-800 focus:border-brandRed text-sm font-black text-brandRed placeholder-zinc-700 rounded-md outline-none w-full px-3 py-2"
                            />
                            <input
                              type="text"
                              value={newOffer.subtitle}
                              onChange={(e) => {
                                const val = e.target.value;
                                const updated = { ...newOffer, subtitle: val };
                                if (!isWhatsappDirty) {
                                  updated.whatsappText = generateWhatsappMessage(newOffer.title, newOffer.price, val);
                                }
                                setNewOffer(updated);
                              }}
                              placeholder="SUBTITLE (e.g. 2 Persons)"
                              className="bg-zinc-950 border border-zinc-800 focus:border-brandRed text-xs text-zinc-400 placeholder-zinc-700 rounded-md outline-none w-full px-3 py-2"
                            />
                          </div>

                          <div className="w-8 h-[2px] bg-brandRed/60 mb-4" />

                          <div className="mb-4">
                            <label className="text-[9px] font-mono text-zinc-500 uppercase block mb-1">Features (One per line)</label>
                            <textarea
                              value={newOffer.features as string}
                              onChange={(e) => setNewOffer({ ...newOffer, features: e.target.value })}
                              placeholder="Full gym access for 2 persons&#10;General coaching and guidance"
                              className="bg-zinc-950 border border-zinc-800 focus:border-brandRed text-xs text-zinc-300 placeholder-zinc-700 rounded-md outline-none w-full h-20 px-3 py-2 resize-none"
                            />
                          </div>

                          <div className="mb-4">
                            <label className="text-[9px] font-mono text-zinc-500 uppercase block mb-1">WhatsApp Claim Message</label>
                            <input
                              type="text"
                              value={newOffer.whatsappText}
                              onChange={(e) => {
                                setIsWhatsappDirty(true);
                                setNewOffer({ ...newOffer, whatsappText: e.target.value });
                              }}
                              placeholder="Hi AN Fitness, I want to claim the..."
                              className="bg-zinc-950 border border-zinc-800 focus:border-brandRed text-[10px] text-zinc-400 placeholder-zinc-700 rounded-md outline-none w-full px-3 py-2"
                            />
                          </div>

                          <div className="flex items-center gap-2 mb-2">
                            <input
                              type="checkbox"
                              id="newOfferActive"
                              checked={newOffer.active === 1}
                              onChange={(e) => setNewOffer({ ...newOffer, active: e.target.checked ? 1 : 0 })}
                              className="rounded border-zinc-800 bg-zinc-950 text-brandRed focus:ring-0 w-4 h-4 cursor-pointer"
                            />
                            <label htmlFor="newOfferActive" className="text-xs text-zinc-400 uppercase tracking-widest select-none cursor-pointer">
                              Render Active on Homepage
                            </label>
                          </div>
                        </div>

                        <div className="flex gap-3 mt-6 pt-4 border-t border-zinc-800/40">
                          <button
                            onClick={() => handleSaveOffer(newOffer, true)}
                            className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase py-2.5 rounded-lg transition-colors cursor-pointer"
                          >
                            <Check size={14} />
                            Save Card
                          </button>
                          <button
                            onClick={() => setNewOffer(null)}
                            className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs uppercase py-2.5 rounded-lg transition-colors cursor-pointer"
                          >
                            <X size={14} />
                            Cancel
                          </button>
                        </div>
                      </div>

                      <div className="text-zinc-500 text-xs space-y-4 max-w-sm mt-4 md:mt-12 pl-2">
                        <p className="font-mono uppercase text-brandRed font-black">Inline Card Guidelines</p>
                        <ul className="list-disc pl-4 space-y-2">
                          <li>The <span className="text-zinc-300">Badge</span> serves as the ribbon highlight on top.</li>
                          <li>Separate the card features with a simple <span className="text-zinc-300">new line</span>. Do not type hyphens or bullet characters.</li>
                          <li>The <span className="text-zinc-300">WhatsApp message</span> is URL encoded so the customer can instantly claim this offer. Use detailed parameters.</li>
                          <li>Set to <span className="text-zinc-300">Active</span> to display this card on the home page.</li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setNewOffer({
                          id: `offer-${Date.now()}`,
                          title: "",
                          subtitle: "2 Persons Access",
                          price: "₹",
                          badge: "",
                          features: "",
                          whatsappText: "Hi AN Fitness, I want to claim the offer",
                          active: 1
                        });
                        setIsWhatsappDirty(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 border border-dashed border-zinc-800 hover:border-brandRed/40 py-8 rounded-2xl text-zinc-500 hover:text-brandRed text-xs font-mono uppercase tracking-widest transition-all cursor-pointer"
                    >
                      <Plus size={16} />
                      Initialize First Campaign Card
                    </button>
                  )}
                </div>
              )}

              {isLoadingOffers ? (
                <div className="py-20 flex justify-center items-center">
                  <Loader2 size={32} className="animate-spin text-brandRed" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {offers.map((offer) => {
                    const isEditing = editingOfferId === offer.id;
                    const featuresList = getFeaturesArray(offer.features);
                    const featuresStr = getFeaturesString(offer.features);

                    return (
                      <div
                        key={offer.id}
                        className={`relative rounded-3xl p-8 sm:p-10 transition-all duration-300 shadow-xl group flex flex-col justify-between ${
                          isEditing
                            ? "border-2 border-brandRed/50 bg-zinc-900/20"
                            : "border border-zinc-900/80 hover:border-zinc-800 bg-zinc-900/10 bg-gradient-to-b from-zinc-900/30 to-transparent"
                        }`}
                      >

                        {!isEditing && (
                          <div className={`absolute top-4 right-4 text-[8px] font-mono font-bold tracking-widest px-2 py-0.5 rounded-md ${
                            offer.active ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-zinc-800 text-zinc-500 border border-zinc-700/50"
                          }`}>
                            {offer.active ? "LIVE ON HOMEPAGE" : "DRAFT/INACTIVE"}
                          </div>
                        )}

                        {isEditing ? (
                          
                          <div className="space-y-4">
                            <div>
                              <label className="text-[8px] font-mono text-zinc-500 uppercase block mb-1">Badge Ribbon</label>
                              <input
                                type="text"
                                defaultValue={offer.badge}
                                onChange={(e) => offer.badge = e.target.value.toUpperCase()}
                                placeholder="BADGE (e.g. DUO SPECIAL)"
                                className="bg-zinc-950 border border-zinc-800 focus:border-brandRed text-[9px] font-mono tracking-widest text-brandRed bg-brandRed/5 px-3 py-1.5 rounded-md uppercase outline-none w-full"
                              />
                            </div>
                            <div>
                              <label className="text-[8px] font-mono text-zinc-500 uppercase block mb-1">Card Title</label>
                              <input
                                type="text"
                                defaultValue={offer.title}
                                onChange={(e) => offer.title = e.target.value}
                                placeholder="TITLE"
                                className="bg-zinc-950 border border-zinc-800 focus:border-brandRed text-sm font-black text-white rounded-md outline-none w-full px-3 py-2 uppercase"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-[8px] font-mono text-zinc-500 uppercase block mb-1">Price</label>
                                <input
                                  type="text"
                                  defaultValue={offer.price}
                                  onChange={(e) => offer.price = e.target.value}
                                  placeholder="PRICE"
                                  className="bg-zinc-950 border border-zinc-800 focus:border-brandRed text-xs font-black text-brandRed rounded-md outline-none w-full px-3 py-2"
                                />
                              </div>
                              <div>
                                <label className="text-[8px] font-mono text-zinc-500 uppercase block mb-1">Subtitle</label>
                                <input
                                  type="text"
                                  defaultValue={offer.subtitle}
                                  onChange={(e) => offer.subtitle = e.target.value}
                                  placeholder="SUBTITLE"
                                  className="bg-zinc-950 border border-zinc-800 focus:border-brandRed text-xs text-zinc-400 rounded-md outline-none w-full px-3 py-2"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="text-[8px] font-mono text-zinc-500 uppercase block mb-1">Features (One per line)</label>
                              <textarea
                                defaultValue={featuresStr}
                                onChange={(e) => offer.features = e.target.value}
                                placeholder="FEATURES"
                                className="bg-zinc-950 border border-zinc-800 focus:border-brandRed text-xs text-zinc-300 rounded-md outline-none w-full h-20 px-3 py-2 resize-none"
                              />
                            </div>
                            <div>
                              <label className="text-[8px] font-mono text-zinc-500 uppercase block mb-1">WhatsApp Template Text</label>
                              <input
                                type="text"
                                defaultValue={offer.whatsappText}
                                onChange={(e) => offer.whatsappText = e.target.value}
                                placeholder="WHATSAPP MSG"
                                className="bg-zinc-950 border border-zinc-800 focus:border-brandRed text-[10px] text-zinc-400 rounded-md outline-none w-full px-3 py-2"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id={`active-${offer.id}`}
                                defaultChecked={offer.active === 1}
                                onChange={(e) => offer.active = e.target.checked ? 1 : 0}
                                className="rounded border-zinc-800 bg-zinc-950 text-brandRed focus:ring-0 w-4 h-4 cursor-pointer"
                              />
                              <label htmlFor={`active-${offer.id}`} className="text-xs text-zinc-400 uppercase tracking-widest select-none cursor-pointer">
                                Active on Homepage
                              </label>
                            </div>

                            <div className="flex gap-2 pt-4 border-t border-zinc-800/40 mt-4">
                              <button
                                onClick={() => handleSaveOffer(offer, false)}
                                className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase py-2 rounded-md transition-colors cursor-pointer"
                              >
                                <Save size={12} />
                                Save
                              </button>
                              <button
                                onClick={() => setEditingOfferId(null)}
                                className="flex-1 flex items-center justify-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs uppercase py-2 rounded-md transition-colors cursor-pointer"
                              >
                                <X size={12} />
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          
                          <div className="flex flex-col justify-between h-full min-h-[250px]">
                            <div>
                              {offer.badge && (
                                <span className="inline-block text-[8px] font-mono tracking-widest text-brandRed bg-brandRed/10 border border-brandRed/20 px-2 py-0.5 rounded-full uppercase mb-4 font-bold">
                                  {offer.badge}
                                </span>
                              )}
                              <h3 className="font-heading font-black text-xl sm:text-2xl text-white uppercase tracking-tight leading-none mb-1 pr-16">
                                {offer.title}
                              </h3>
                              <div className="flex items-baseline gap-2 mb-3">
                                <span className="font-heading font-black text-2xl sm:text-3xl text-brandRed">{offer.price}</span>
                                <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">{offer.subtitle}</span>
                              </div>

                              <div className="w-8 h-[1px] bg-brandRed/60 mb-4" />

                              <ul className="flex flex-col gap-2 mb-6">
                                {featuresList.map((feat, fidx) => (
                                  <li key={fidx} className="flex items-start gap-2 text-zinc-400 text-xs font-light">
                                    <Check size={12} className="text-brandRed shrink-0 mt-0.5" />
                                    <span>{feat}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="flex gap-2 pt-4 border-t border-zinc-900 bg-zinc-900/5">
                              <button
                                onClick={() => setEditingOfferId(offer.id)}
                                className="flex-1 flex items-center justify-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/50 hover:border-zinc-600 text-white font-bold text-xs uppercase py-2.5 rounded-lg transition-colors cursor-pointer"
                              >
                                <Edit2 size={12} />
                                Edit Card
                              </button>
                              <button
                                onClick={() => handleDeleteOffer(offer.id)}
                                className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800/80 hover:bg-brandRed hover:border-brandRed text-zinc-500 hover:text-white transition-all cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "memberships" && (
            <div className="flex flex-col gap-8">

              {(newMembership || memberships.length === 0) && (
                <div className="border border-dashed border-zinc-800 rounded-3xl p-6 bg-zinc-900/10">
                  <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-6 pl-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brandRed" />
                    {newMembership ? "Creating New Pricing Plan" : "No Membership Plans Setup. Create one now."}
                  </h3>

                  {newMembership ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

                      <div className="relative bg-zinc-900/40 border-2 border-brandRed/40 rounded-3xl p-8 sm:p-10 bg-gradient-to-b from-zinc-900/50 to-transparent backdrop-blur-sm shadow-2xl flex flex-col justify-between min-h-[350px]">
                        <div>

                          <div className="mb-4">
                            <input
                              type="text"
                              value={newMembership.badge}
                              onChange={(e) => setNewMembership({ ...newMembership, badge: e.target.value.toUpperCase() })}
                              placeholder="BADGE (e.g. MOST POPULAR)"
                              className="bg-zinc-950 border border-zinc-800 focus:border-brandRed text-[9px] font-mono tracking-widest text-brandRed bg-brandRed/5 px-3 py-1.5 rounded-md uppercase placeholder-zinc-700 outline-none w-full"
                            />
                          </div>

                          <div className="mb-4">
                            <input
                              type="text"
                              value={newMembership.name}
                              onChange={(e) => setNewMembership({ ...newMembership, name: e.target.value })}
                              placeholder="PLAN NAME (e.g. 1 MONTH PASS)"
                              className="bg-zinc-950 border border-zinc-800 focus:border-brandRed text-sm sm:text-base font-black text-white placeholder-zinc-700 rounded-md outline-none w-full px-3 py-2 uppercase"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <input
                              type="number"
                              value={newMembership.price || ""}
                              onChange={(e) => setNewMembership({ ...newMembership, price: Number(e.target.value) })}
                              placeholder="PRICE (e.g. 2000)"
                              className="bg-zinc-950 border border-zinc-800 focus:border-brandRed text-sm font-black text-brandRed placeholder-zinc-700 rounded-md outline-none w-full px-3 py-2"
                            />
                            <input
                              type="text"
                              value={newMembership.billing}
                              onChange={(e) => setNewMembership({ ...newMembership, billing: e.target.value })}
                              placeholder="BILLING (e.g. / month)"
                              className="bg-zinc-950 border border-zinc-800 focus:border-brandRed text-xs text-zinc-400 placeholder-zinc-700 rounded-md outline-none w-full px-3 py-2"
                            />
                          </div>

                          <div className="w-8 h-[2px] bg-brandRed/60 mb-4" />

                          <div className="mb-4">
                            <label className="text-[9px] font-mono text-zinc-500 uppercase block mb-1">Features (One per line)</label>
                            <textarea
                              value={newMembership.features as string}
                              onChange={(e) => setNewMembership({ ...newMembership, features: e.target.value })}
                              placeholder="Full gym deck access&#10;Free locker rooms&#10;General guidance"
                              className="bg-zinc-950 border border-zinc-800 focus:border-brandRed text-xs text-zinc-300 placeholder-zinc-700 rounded-md outline-none w-full h-24 px-3 py-2 resize-none"
                            />
                          </div>

                          <div className="flex items-center gap-2 mb-2">
                            <input
                              type="checkbox"
                              id="newPlanPopular"
                              checked={newMembership.popular === 1}
                              onChange={(e) => setNewMembership({ ...newMembership, popular: e.target.checked ? 1 : 0 })}
                              className="rounded border-zinc-800 bg-zinc-950 text-brandRed focus:ring-0 w-4 h-4 cursor-pointer"
                            />
                            <label htmlFor="newPlanPopular" className="text-xs text-zinc-400 uppercase tracking-widest select-none cursor-pointer">
                              Highlight Card (Popular Accent)
                            </label>
                          </div>
                        </div>

                        <div className="flex gap-3 mt-6 pt-4 border-t border-zinc-800/40">
                          <button
                            onClick={() => handleSaveMembership(newMembership, true)}
                            className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase py-2.5 rounded-lg transition-colors cursor-pointer"
                          >
                            <Check size={14} />
                            Save Plan
                          </button>
                          <button
                            onClick={() => setNewMembership(null)}
                            className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs uppercase py-2.5 rounded-lg transition-colors cursor-pointer"
                          >
                            <X size={14} />
                            Cancel
                          </button>
                        </div>
                      </div>

                      <div className="text-zinc-500 text-xs space-y-4 max-w-sm mt-4 md:mt-12 pl-2">
                        <p className="font-mono uppercase text-brandRed font-black">Plan Guidelines</p>
                        <ul className="list-disc pl-4 space-y-2">
                          <li>Type the pricing as a raw number. The frontend formats the currency automatically.</li>
                          <li>Select <span className="text-zinc-300">Highlight Card</span> to render a glowing red border around the card on the membership page to attract attention.</li>
                          <li>List features line-by-line in the text box.</li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setNewMembership({
                        id: `plan-${Date.now()}`,
                        name: "",
                        price: 0,
                        billing: "/ month",
                        features: "",
                        popular: 0,
                        badge: ""
                      })}
                      className="w-full flex items-center justify-center gap-2 border border-dashed border-zinc-800 hover:border-brandRed/40 py-8 rounded-2xl text-zinc-500 hover:text-brandRed text-xs font-mono uppercase tracking-widest transition-all cursor-pointer"
                    >
                      <Plus size={16} />
                      Initialize First Membership Plan
                    </button>
                  )}
                </div>
              )}

              {isLoadingMemberships ? (
                <div className="py-20 flex justify-center items-center">
                  <Loader2 size={32} className="animate-spin text-brandRed" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {memberships.map((membership) => {
                    const isEditing = editingMembershipId === membership.id;
                    const featuresList = getFeaturesArray(membership.features);
                    const featuresStr = getFeaturesString(membership.features);

                    return (
                      <div
                        key={membership.id}
                        className={`relative rounded-3xl p-6 sm:p-8 transition-all duration-300 shadow-xl group flex flex-col justify-between ${
                          isEditing
                            ? "border-2 border-brandRed/50 bg-zinc-900/20"
                            : membership.popular
                              ? "border-2 border-brandRed bg-zinc-900/10 shadow-[0_0_20px_rgba(214,26,31,0.15)] bg-gradient-to-b from-brandRed/5 to-transparent"
                              : "border border-zinc-900/80 hover:border-zinc-800 bg-zinc-900/10 bg-gradient-to-b from-zinc-900/30 to-transparent"
                        }`}
                      >

                        {!isEditing && membership.popular === 1 && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brandRed text-white text-[8px] font-mono font-bold tracking-widest px-3 py-1 rounded-full uppercase shadow-md shadow-brandRed/20">
                            {membership.badge || "RECOMMENDED"}
                          </div>
                        )}

                        {isEditing ? (
                          
                          <div className="space-y-4">
                            <div>
                              <label className="text-[8px] font-mono text-zinc-500 uppercase block mb-1">Badge Label</label>
                              <input
                                type="text"
                                defaultValue={membership.badge}
                                onChange={(e) => membership.badge = e.target.value.toUpperCase()}
                                placeholder="BADGE (e.g. VALUE PACK)"
                                className="bg-zinc-950 border border-zinc-800 focus:border-brandRed text-[9px] font-mono tracking-widest text-brandRed bg-brandRed/5 px-3 py-1.5 rounded-md uppercase outline-none w-full"
                              />
                            </div>
                            <div>
                              <label className="text-[8px] font-mono text-zinc-500 uppercase block mb-1">Plan Name</label>
                              <input
                                type="text"
                                defaultValue={membership.name}
                                onChange={(e) => membership.name = e.target.value}
                                placeholder="NAME"
                                className="bg-zinc-950 border border-zinc-800 focus:border-brandRed text-xs font-black text-white rounded-md outline-none w-full px-3 py-2 uppercase"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[8px] font-mono text-zinc-500 uppercase block mb-1">Price (Number)</label>
                                <input
                                  type="number"
                                  defaultValue={membership.price}
                                  onChange={(e) => membership.price = Number(e.target.value)}
                                  placeholder="PRICE"
                                  className="bg-zinc-950 border border-zinc-800 focus:border-brandRed text-xs text-brandRed font-black rounded-md outline-none w-full px-3 py-2"
                                />
                              </div>
                              <div>
                                <label className="text-[8px] font-mono text-zinc-500 uppercase block mb-1">Billing cycle</label>
                                <input
                                  type="text"
                                  defaultValue={membership.billing}
                                  onChange={(e) => membership.billing = e.target.value}
                                  placeholder="BILLING"
                                  className="bg-zinc-950 border border-zinc-800 focus:border-brandRed text-xs text-zinc-400 rounded-md outline-none w-full px-3 py-2"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="text-[8px] font-mono text-zinc-500 uppercase block mb-1">Features (One per line)</label>
                              <textarea
                                defaultValue={featuresStr}
                                onChange={(e) => membership.features = e.target.value}
                                placeholder="FEATURES"
                                className="bg-zinc-950 border border-zinc-800 focus:border-brandRed text-xs text-zinc-300 rounded-md outline-none w-full h-24 px-3 py-2 resize-none"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id={`pop-${membership.id}`}
                                defaultChecked={membership.popular === 1}
                                onChange={(e) => membership.popular = e.target.checked ? 1 : 0}
                                className="rounded border-zinc-800 bg-zinc-950 text-brandRed focus:ring-0 w-4 h-4 cursor-pointer"
                              />
                              <label htmlFor={`pop-${membership.id}`} className="text-xs text-zinc-400 uppercase tracking-widest select-none cursor-pointer">
                                Highlight / Popular
                              </label>
                            </div>

                            <div className="flex gap-2 pt-4 border-t border-zinc-800/40 mt-4">
                              <button
                                onClick={() => handleSaveMembership(membership, false)}
                                className="flex-1 flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] uppercase py-2 rounded-md transition-colors cursor-pointer"
                              >
                                <Save size={10} />
                                Save
                              </button>
                              <button
                                onClick={() => setEditingMembershipId(null)}
                                className="flex-1 flex items-center justify-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-[10px] uppercase py-2 rounded-md transition-colors cursor-pointer"
                              >
                                <X size={10} />
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          
                          <div className="flex flex-col justify-between h-full min-h-[280px]">
                            <div>
                              <h3 className="font-heading font-black text-lg sm:text-xl text-white uppercase tracking-tight leading-none mb-1">
                                {membership.name}
                              </h3>
                              <div className="flex items-baseline gap-1 mb-3">
                                <span className="font-heading font-black text-2xl sm:text-3xl text-brandRed">₹{membership.price}</span>
                                <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">{membership.billing}</span>
                              </div>

                              <div className="w-8 h-[1px] bg-brandRed/60 mb-4" />

                              <ul className="flex flex-col gap-2 mb-6">
                                {featuresList.map((feat, fidx) => (
                                  <li key={fidx} className="flex items-start gap-2 text-zinc-400 text-xs font-light">
                                    <Check size={12} className="text-brandRed shrink-0 mt-0.5" />
                                    <span>{feat}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="flex gap-2 pt-4 border-t border-zinc-900/50">
                              <button
                                onClick={() => setEditingMembershipId(membership.id)}
                                className="flex-1 flex items-center justify-center gap-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/50 hover:border-zinc-600 text-white font-bold text-xs uppercase py-2 rounded-lg transition-colors cursor-pointer"
                              >
                                <Edit2 size={10} />
                                Edit Plan
                              </button>
                              <button
                                onClick={() => handleDeleteMembership(membership.id)}
                                className="p-2 rounded-lg bg-zinc-900 border border-zinc-800/80 hover:bg-brandRed hover:border-brandRed text-zinc-500 hover:text-white transition-all cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "gallery" && (
            <div className="flex flex-col gap-8">

              <div className="bg-zinc-900/10 border border-zinc-900 rounded-3xl p-6 md:p-8 backdrop-blur-sm">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                  <div className="lg:col-span-3 flex flex-col gap-4">
                    <label className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-widest pl-1">
                      Select Image Files (Multiple allowed)
                    </label>
                    
                    <div className="relative border border-dashed border-zinc-800 hover:border-brandRed/40 bg-zinc-950/40 rounded-2xl p-8 flex flex-col items-center justify-center text-center group transition-all duration-300 min-h-[120px] cursor-pointer">
                      <div className="flex flex-col items-center">
                        <Upload size={28} className="text-zinc-600 group-hover:text-brandRed transition-colors mb-2" />
                        <span className="text-xs font-bold text-zinc-300 uppercase tracking-wide">Choose Pictures</span>
                        <span className="text-[10px] text-zinc-600 mt-1 uppercase font-mono">PNG, JPG, WEBP (Max 2MB per file after compression)</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        disabled={isUploading}
                      />
                    </div>
                  </div>

                  {uploadTasks.length > 0 && (
                    <div className="lg:col-span-3 flex flex-col gap-4">
                      <h4 className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-widest pl-1">
                        Queue ({uploadTasks.length} file{uploadTasks.length > 1 ? "s" : ""})
                      </h4>
                      <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-none">
                        {uploadTasks.map((task) => (
                          <div
                            key={task.id}
                            className={`flex flex-col gap-3 p-4 rounded-2xl bg-zinc-950/80 border transition-colors ${
                              task.status === "error"
                                ? "border-brandRed/30 bg-brandRed/5"
                                : task.status === "success"
                                ? "border-emerald-500/30 bg-emerald-500/5"
                                : "border-zinc-900 bg-zinc-900/10"
                            }`}
                          >
                            <div className="flex gap-4 items-center">
                              <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-zinc-900 shrink-0 border border-zinc-800">

                                <img src={task.preview} alt="Upload preview" className="w-full h-full object-cover" />
                                
                                {(task.status === "compressing" || task.status === "uploading") && (
                                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                    <Loader2 size={12} className="animate-spin text-brandRed" />
                                  </div>
                                )}
                              </div>

                              <div className="flex-1 flex flex-col gap-2 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <input
                                    type="text"
                                    value={task.title}
                                    onChange={(e) =>
                                      setUploadTasks((prev) =>
                                        prev.map((t) => (t.id === task.id ? { ...t, title: e.target.value } : t))
                                      )
                                    }
                                    placeholder="Title / Description"
                                    className="bg-zinc-950 border border-zinc-900 focus:border-brandRed text-xs text-white rounded-lg px-2.5 py-1.5 outline-none flex-1 truncate"
                                    disabled={isUploading || task.status === "success"}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveTask(task.id)}
                                    className="p-1.5 rounded-lg bg-zinc-900 hover:bg-brandRed hover:text-white text-zinc-500 transition-colors shrink-0"
                                    disabled={isUploading}
                                  >
                                    <X size={12} />
                                  </button>
                                </div>

                                <div className="flex items-center justify-between gap-2">
                                  <select
                                    value={task.category}
                                    onChange={(e) =>
                                      setUploadTasks((prev) =>
                                        prev.map((t) => (t.id === task.id ? { ...t, category: e.target.value } : t))
                                      )
                                    }
                                    className="bg-zinc-950 border border-zinc-900 text-[10px] text-zinc-400 rounded-lg px-2 py-1 outline-none cursor-pointer"
                                    disabled={isUploading || task.status === "success"}
                                  >
                                    <option value="strength">STRENGTH DECK</option>
                                    <option value="combat">COMBAT ZONE</option>
                                    <option value="recovery">RECOVERY SPA</option>
                                    <option value="facility">FACILITY ROOMS</option>
                                  </select>

                                  <span className={`text-[9px] font-mono uppercase font-black ${
                                    task.status === "error"
                                      ? "text-brandRed"
                                      : task.status === "success"
                                      ? "text-emerald-500"
                                      : task.status === "uploading" || task.status === "compressing"
                                      ? "text-brandRed animate-pulse"
                                      : "text-zinc-500"
                                  }`}>
                                    {(task.status === "compressing" || task.status === "uploading") && "Processing..."}
                                    {task.status === "idle" && "Ready"}
                                    {task.status === "success" && "Uploaded"}
                                    {task.status === "error" && "Something went wrong"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {(task.status === "compressing" || task.status === "uploading") && (
                              <div className="w-full bg-zinc-900 h-0.5 rounded-full overflow-hidden">
                                <div className="bg-brandRed h-full w-full rounded-full animate-pulse" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={handleUploadGallery}
                        disabled={isUploading || uploadTasks.filter(t => t.status === "idle").length === 0}
                        className="w-full sm:w-auto self-end flex items-center justify-center gap-2 bg-brandRed hover:bg-brandRed-light disabled:bg-zinc-850 disabled:text-zinc-600 text-white font-black tracking-widest text-xs uppercase px-8 py-3.5 rounded-xl shadow-lg transition-all cursor-pointer mt-4"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            UPLOADING...
                          </>
                        ) : (
                          <>
                            UPLOAD ALL READY PHOTOS ({uploadTasks.filter(t => t.status === "idle").length})
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {isLoadingGallery ? (
                <div className="py-20 flex justify-center items-center">
                  <Loader2 size={32} className="animate-spin text-brandRed" />
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {gallery.map((photo) => (
                    <div
                      key={photo.id}
                      className="group relative aspect-square rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-900 hover:border-zinc-800 shadow-lg transition-all duration-300"
                    >

                      <img
                        src={photo.url}
                        alt={photo.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-95"
                      />
                      

                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 flex flex-col justify-between items-start">
                        <span className="text-[8px] font-mono tracking-widest text-brandRed bg-brandRed/10 border border-brandRed/20 px-2 py-0.5 rounded uppercase font-bold">
                          {photo.category}
                        </span>

                        <div className="w-full flex justify-between items-center gap-2">
                          <p className="text-[10px] font-bold text-white uppercase truncate flex-1 leading-none">{photo.title}</p>
                          <button
                            onClick={() => handleDeleteGallery(photo.id)}
                            className="p-1.5 rounded-lg bg-zinc-950 border border-zinc-900 hover:bg-brandRed hover:border-brandRed text-zinc-500 hover:text-white transition-colors cursor-pointer"
                            title="Delete Photo"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {gallery.length === 0 && (
                    <div className="col-span-full py-16 text-center text-zinc-600 text-xs font-mono uppercase tracking-widest">
                      Gallery is empty. Upload training photos.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "events" && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-900/20 border border-zinc-900 rounded-3xl p-6">
                <div>
                  <h3 className="font-heading font-black text-xl text-white uppercase tracking-tight flex items-center gap-3">
                    <Calendar className="text-brandRed" size={22} />
                    EVENTS & NOTIFICATIONS
                  </h3>
                  <p className="text-zinc-500 text-xs mt-1 flex items-center gap-2">
                    <span>Manage upcoming events, workshops, announcements, and bulletins.</span>
                    <span className="text-emerald-400 font-mono font-bold bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px]">
                      📢 {pushStatus?.subscriberCount ?? 0} Push Subscribers
                    </span>
                  </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <button
                    onClick={() => setNewEvent({
                      id: `event-${Date.now()}`,
                      title: "",
                      description: "",
                      date: "",
                      time: "",
                      location: "AN Fitness, Khordha",
                      posterUrl: "",
                      category: "Special Event",
                      type: "event",
                      sendPush: true
                    })}
                    className="inline-flex items-center gap-2 bg-brandRed hover:bg-red-700 text-white font-bold text-xs uppercase tracking-widest px-4 py-3 rounded-xl transition-all cursor-pointer shadow-lg shadow-brandRed/20"
                  >
                    <Plus size={16} />
                    CREATE EVENT
                  </button>

                  <button
                    onClick={() => setNewEvent({
                      id: `notification-${Date.now()}`,
                      title: "",
                      description: "",
                      date: "",
                      time: "",
                      location: "AN Fitness, Khordha",
                      posterUrl: "",
                      category: "Bulletin Notice",
                      type: "notification",
                      sendPush: true
                    })}
                    className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs uppercase tracking-widest px-4 py-3 rounded-xl transition-all cursor-pointer shadow-lg shadow-amber-500/20"
                  >
                    <Megaphone size={16} />
                    CREATE NOTIFICATION
                  </button>

                  <button
                    onClick={() => setShowQuickPushForm(!showQuickPushForm)}
                    className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-bold text-xs uppercase tracking-widest px-4 py-3 rounded-xl transition-all cursor-pointer"
                  >
                    <Bell size={16} className="text-brandRed" />
                    {showQuickPushForm ? "HIDE QUICK PUSH" : "⚡ QUICK PUSH"}
                  </button>
                </div>
              </div>

              {showQuickPushForm && (
                <div className="bg-zinc-900/40 border border-amber-500/30 rounded-3xl p-6 sm:p-8 flex flex-col gap-6 backdrop-blur-md animate-fadeIn">
                  <div className="border-b border-zinc-800 pb-4 flex items-center justify-between">
                    <h4 className="font-heading font-black text-base uppercase tracking-wider text-white flex items-center gap-2">
                      <Send size={16} className="text-amber-500" />
                      QUICK ANNOUNCEMENT & INSTANT PUSH BROADCAST
                    </h4>
                    <button
                      onClick={() => setShowQuickPushForm(false)}
                      className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:text-white text-zinc-500 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <form onSubmit={handleSendManualPush} className="flex flex-col gap-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-mono uppercase font-bold text-zinc-400">NOTIFICATION / EVENT TITLE *</label>
                        <input
                          type="text"
                          value={pushTitle}
                          onChange={(e) => setPushTitle(e.target.value)}
                          placeholder="e.g. 📢 SPECIAL ANNOUNCEMENT: GYM TIMINGS UPDATE"
                          className="bg-zinc-950 border border-zinc-800 focus:border-brandRed px-4 py-3 rounded-xl text-xs text-white outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-mono uppercase font-bold text-zinc-400">CATEGORY TYPE</label>
                          <select
                            value={pushType}
                            onChange={(e) => setPushType(e.target.value as "event" | "notification")}
                            className="bg-zinc-950 border border-zinc-800 focus:border-brandRed px-3 py-3 rounded-xl text-xs text-white outline-none cursor-pointer"
                          >
                            <option value="notification">📢 Announcement</option>
                            <option value="event">🏋️ Event / Workshop</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-mono uppercase font-bold text-zinc-400">TARGET LINK</label>
                          <input
                            type="text"
                            value={pushUrl}
                            onChange={(e) => setPushUrl(e.target.value)}
                            placeholder="/events"
                            className="bg-zinc-950 border border-zinc-800 focus:border-brandRed px-3 py-3 rounded-xl text-xs text-white outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-mono uppercase font-bold text-zinc-400">MESSAGE BODY & BULLETIN DETAILS *</label>
                      <textarea
                        rows={3}
                        value={pushMessage}
                        onChange={(e) => setPushMessage(e.target.value)}
                        placeholder="Write your announcement message body here..."
                        className="bg-zinc-950 border border-zinc-800 focus:border-brandRed p-4 rounded-xl text-xs text-white outline-none resize-none"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-mono uppercase font-bold text-zinc-400">ATTACHMENT IMAGE / POSTER URL (OPTIONAL)</label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={pushImage}
                          onChange={(e) => setPushImage(e.target.value)}
                          placeholder="Image URL or upload poster image..."
                          className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-brandRed px-4 py-3 rounded-xl text-xs text-white outline-none"
                        />
                        <label className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-3 rounded-xl text-xs font-mono font-bold cursor-pointer transition-colors shrink-0 flex items-center gap-2">
                          {isUploadingPoster ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                          UPLOAD
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handlePosterFileUpload(file, (url) => setPushImage(url));
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isBroadcasting}
                      className="mt-2 self-end inline-flex items-center gap-2 bg-brandRed hover:bg-brandRed-light disabled:opacity-60 text-white font-bold text-xs uppercase tracking-widest px-8 py-4 rounded-xl transition-all cursor-pointer shadow-lg shadow-brandRed/20"
                    >
                      {isBroadcasting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          PUBLISHING & SENDING PUSH ALERTS...
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          PUBLISH POST & SEND PUSH ALERTS NOW
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {(newEvent || editingEventId) && (
                <div className="bg-zinc-900/40 border border-brandRed/30 rounded-3xl p-6 sm:p-8 flex flex-col gap-6 backdrop-blur-md animate-fadeIn">
                  <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
                    <h4 className="font-heading font-black text-base uppercase tracking-wider text-white">
                      {newEvent
                        ? newEvent.type === "notification" ? "CREATE NEW NOTIFICATION" : "CREATE NEW EVENT"
                        : "EDIT DETAILS"}
                    </h4>
                    <button
                      onClick={() => { setNewEvent(null); setEditingEventId(null); }}
                      className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:text-white text-zinc-500 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {(() => {
                    const activeEvent = newEvent || events.find(e => e.id === editingEventId);
                    if (!activeEvent) return null;

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-mono uppercase font-bold text-zinc-400">PUBLISH TYPE *</label>
                              <select
                                value={activeEvent.type || "event"}
                                onChange={(e) => {
                                  const val = e.target.value as "event" | "notification";
                                  if (newEvent) setNewEvent({ ...newEvent, type: val });
                                  else setEvents(events.map(ev => ev.id === editingEventId ? { ...ev, type: val } : ev));
                                }}
                                className="bg-zinc-950 border border-zinc-800 focus:border-brandRed px-3 py-3 rounded-xl text-xs text-white outline-none cursor-pointer"
                              >
                                <option value="event">🏋️ EVENT / WORKSHOP</option>
                                <option value="notification">📢 NOTIFICATION / BULLETIN</option>
                              </select>
                            </div>

                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-mono uppercase font-bold text-zinc-400">PUSH ALERT</label>
                              <label className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 px-3 py-3 rounded-xl cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={activeEvent.sendPush ?? true}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    if (newEvent) setNewEvent({ ...newEvent, sendPush: checked });
                                    else setEvents(events.map(ev => ev.id === editingEventId ? { ...ev, sendPush: checked } : ev));
                                  }}
                                  className="w-4 h-4 accent-brandRed cursor-pointer"
                                />
                                <span className="text-[11px] font-mono text-zinc-300">PUSH ALERT</span>
                              </label>
                            </div>
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-mono uppercase font-bold text-zinc-400">TITLE *</label>
                            <input
                              type="text"
                              value={activeEvent.title}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (newEvent) setNewEvent({ ...newEvent, title: val });
                                else setEvents(events.map(ev => ev.id === editingEventId ? { ...ev, title: val } : ev));
                              }}
                              placeholder="e.g. ANNUAL POWERLIFTING WORKSHOP 2026"
                              className="bg-zinc-950 border border-zinc-800 focus:border-brandRed px-4 py-3 rounded-xl text-xs text-white outline-none"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-mono uppercase font-bold text-zinc-400">CATEGORY</label>
                              <input
                                type="text"
                                value={activeEvent.category}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (newEvent) setNewEvent({ ...newEvent, category: val });
                                  else setEvents(events.map(ev => ev.id === editingEventId ? { ...ev, category: val } : ev));
                                }}
                                placeholder="Zumba / Workshop / Notice"
                                className="bg-zinc-950 border border-zinc-800 focus:border-brandRed px-4 py-3 rounded-xl text-xs text-white outline-none"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-mono uppercase font-bold text-zinc-400">DATE (OPTIONAL)</label>
                              <input
                                type="text"
                                value={activeEvent.date}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (newEvent) setNewEvent({ ...newEvent, date: val });
                                  else setEvents(events.map(ev => ev.id === editingEventId ? { ...ev, date: val } : ev));
                                }}
                                placeholder="e.g. 25th Aug 2026"
                                className="bg-zinc-950 border border-zinc-800 focus:border-brandRed px-4 py-3 rounded-xl text-xs text-white outline-none"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-mono uppercase font-bold text-zinc-400">TIME (OPTIONAL)</label>
                              <input
                                type="text"
                                value={activeEvent.time}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (newEvent) setNewEvent({ ...newEvent, time: val });
                                  else setEvents(events.map(ev => ev.id === editingEventId ? { ...ev, time: val } : ev));
                                }}
                                placeholder="e.g. 6:00 AM - 9:00 AM"
                                className="bg-zinc-950 border border-zinc-800 focus:border-brandRed px-4 py-3 rounded-xl text-xs text-white outline-none"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-mono uppercase font-bold text-zinc-400">LOCATION (OPTIONAL)</label>
                              <input
                                type="text"
                                value={activeEvent.location}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (newEvent) setNewEvent({ ...newEvent, location: val });
                                  else setEvents(events.map(ev => ev.id === editingEventId ? { ...ev, location: val } : ev));
                                }}
                                placeholder="AN Fitness, Palla, Khordha"
                                className="bg-zinc-950 border border-zinc-800 focus:border-brandRed px-4 py-3 rounded-xl text-xs text-white outline-none"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-4">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-mono uppercase font-bold text-zinc-400">POSTER IMAGE (OPTIONAL - LEAVE BLANK FOR TEXT-ONLY)</label>
                            <div className="flex gap-2 items-center">
                              <input
                                type="text"
                                value={activeEvent.posterUrl || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (newEvent) setNewEvent({ ...newEvent, posterUrl: val });
                                  else setEvents(events.map(ev => ev.id === editingEventId ? { ...ev, posterUrl: val } : ev));
                                }}
                                placeholder="Poster image URL or upload below..."
                                className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-brandRed px-4 py-3 rounded-xl text-xs text-white outline-none"
                              />
                              <label className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-3 rounded-xl text-xs font-mono font-bold cursor-pointer transition-colors shrink-0 flex items-center gap-2">
                                {isUploadingPoster ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                                UPLOAD
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      handlePosterFileUpload(file, (url) => {
                                        if (newEvent) setNewEvent({ ...newEvent, posterUrl: url });
                                        else setEvents(events.map(ev => ev.id === editingEventId ? { ...ev, posterUrl: url } : ev));
                                      });
                                    }
                                  }}
                                />
                              </label>
                            </div>
                          </div>

                          <div className="flex flex-col gap-1.5 flex-1">
                            <label className="text-[10px] font-mono uppercase font-bold text-zinc-400">DESCRIPTION & DETAILS *</label>
                            <textarea
                              rows={4}
                              value={activeEvent.description}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (newEvent) setNewEvent({ ...newEvent, description: val });
                                else setEvents(events.map(ev => ev.id === editingEventId ? { ...ev, description: val } : ev));
                              }}
                              placeholder="Write description, agenda, guidelines, or notice details..."
                              className="w-full h-full bg-zinc-950 border border-zinc-800 focus:border-brandRed p-4 rounded-xl text-xs text-white outline-none resize-none"
                            />
                          </div>

                          <div className="flex justify-end gap-3 pt-2">
                            <button
                              onClick={() => { setNewEvent(null); setEditingEventId(null); }}
                              className="px-5 py-3 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white text-xs font-bold uppercase transition-colors cursor-pointer"
                            >
                              CANCEL
                            </button>
                            <button
                              onClick={() => handleSaveEvent(activeEvent, !!newEvent)}
                              className="px-6 py-3 rounded-xl bg-brandRed hover:bg-red-700 text-white text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 cursor-pointer"
                            >
                              <Save size={14} />
                              SAVE & PUBLISH
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
                <button
                  onClick={() => setAdminEventsFilter("all")}
                  className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    adminEventsFilter === "all" ? "bg-zinc-800 text-white border border-zinc-700" : "text-zinc-500 hover:text-white"
                  }`}
                >
                  ALL ITEMS ({events.length})
                </button>
                <button
                  onClick={() => setAdminEventsFilter("event")}
                  className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    adminEventsFilter === "event" ? "bg-zinc-800 text-white border border-zinc-700" : "text-zinc-500 hover:text-white"
                  }`}
                >
                  EVENTS ONLY ({events.filter(e => e.type !== "notification").length})
                </button>
                <button
                  onClick={() => setAdminEventsFilter("notification")}
                  className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    adminEventsFilter === "notification" ? "bg-zinc-800 text-white border border-zinc-700" : "text-zinc-500 hover:text-white"
                  }`}
                >
                  NOTIFICATIONS ONLY ({events.filter(e => e.type === "notification").length})
                </button>
              </div>

              <div className="bg-zinc-900/10 border border-zinc-900 rounded-3xl p-6">
                {isLoadingEvents ? (
                  <div className="py-16 flex items-center justify-center">
                    <Loader2 size={32} className="animate-spin text-brandRed" />
                  </div>
                ) : events.length === 0 ? (
                  <div className="py-16 text-center text-zinc-600 text-xs font-mono uppercase tracking-widest">
                    No items published yet. Click "CREATE EVENT" or "CREATE NOTIFICATION" to publish.
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {events
                      .filter(ev => {
                        if (adminEventsFilter === "event") return ev.type !== "notification";
                        if (adminEventsFilter === "notification") return ev.type === "notification";
                        return true;
                      })
                      .map((ev) => {
                        const isNotif = ev.type === "notification";

                        return (
                          <div
                            key={ev.id}
                            className={`bg-zinc-950 border rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row gap-5 justify-between items-start md:items-center transition-all ${
                              isNotif ? "border-amber-500/30 hover:border-amber-500/50" : "border-zinc-800/80 hover:border-zinc-700"
                            }`}
                          >
                            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center flex-1">
                              {ev.posterUrl ? (
                                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-zinc-900 shrink-0 border border-zinc-800">

                                  <img src={ev.posterUrl} alt={ev.title} className="w-full h-full object-cover" />
                                </div>
                              ) : (
                                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col items-center justify-center shrink-0 p-2 text-center">
                                  {isNotif ? <Megaphone size={20} className="text-amber-500 mb-1" /> : <FileText size={20} className="text-zinc-600 mb-1" />}
                                  <span className="text-[8px] font-mono text-zinc-600 uppercase">{isNotif ? "Notice" : "Text Only"}</span>
                                </div>
                              )}

                              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className={`text-[8px] font-mono font-bold tracking-widest border px-2 py-0.5 rounded uppercase flex items-center gap-1 ${
                                      isNotif
                                        ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                                        : "bg-brandRed/10 border-brandRed/20 text-brandRed"
                                    }`}
                                  >
                                    {isNotif ? "📢 NOTIFICATION" : "🏋️ EVENT"}
                                  </span>

                                  <span className="text-[8px] font-mono font-bold tracking-widest text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded uppercase">
                                    {ev.category || "General"}
                                  </span>

                                  {ev.date && (
                                    <span className="text-[9px] font-mono text-zinc-400">
                                      {ev.date} {ev.time && `• ${ev.time}`}
                                    </span>
                                  )}
                                </div>

                                <h4 className="font-heading font-black text-sm text-white uppercase truncate">
                                  {ev.title}
                                </h4>
                                <p className="text-zinc-400 text-xs line-clamp-2 font-light">
                                  {ev.description}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                              <button
                                onClick={() => setEditingEventId(ev.id)}
                                className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                                title={`Edit ${isNotif ? "Notification" : "Event"}`}
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteEvent(ev.id, ev.title, ev.type)}
                                className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-brandRed hover:bg-brandRed text-zinc-400 hover:text-white transition-colors cursor-pointer"
                                title={`Delete ${isNotif ? "Notification" : "Event"}`}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="max-w-xl bg-zinc-900/10 border border-zinc-900 rounded-3xl p-8 backdrop-blur-sm">
              <h3 className="font-heading font-black text-lg text-white uppercase tracking-tight mb-6 flex items-center gap-3">
                <ShieldAlert className="text-brandRed" size={20} />
                ADMIN SECURITY SETTING
              </h3>
              
              <form onSubmit={handleUpdatePassword} className="flex flex-col gap-6">
                {passwordStatus.error && (
                  <div className="bg-brandRed/10 border border-brandRed/20 text-brandRed-light text-xs px-4 py-3 rounded-xl">
                    {passwordStatus.error}
                  </div>
                )}
                
                {passwordStatus.success && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-4 py-3 rounded-xl">
                    {passwordStatus.success}
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-widest pl-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-brandRed text-white px-4 py-3.5 rounded-xl text-xs placeholder-zinc-700 outline-none transition-all duration-300"
                    required
                    disabled={passwordStatus.loading}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-widest pl-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="•••••••• (Min 6 characters)"
                    className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-brandRed text-white px-4 py-3.5 rounded-xl text-xs placeholder-zinc-700 outline-none transition-all duration-300"
                    required
                    disabled={passwordStatus.loading}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-widest pl-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-brandRed text-white px-4 py-3.5 rounded-xl text-xs placeholder-zinc-700 outline-none transition-all duration-300"
                    required
                    disabled={passwordStatus.loading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={passwordStatus.loading}
                  className="flex items-center justify-center gap-2 bg-brandRed hover:bg-brandRed-light disabled:bg-zinc-850 text-white font-black tracking-widest text-xs uppercase py-4 rounded-xl shadow-lg transition-all cursor-pointer"
                >
                  {passwordStatus.loading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      UPDATING PASSWORD...
                    </>
                  ) : (
                    <>
                      UPDATE SECURITY CREDENTIALS
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
