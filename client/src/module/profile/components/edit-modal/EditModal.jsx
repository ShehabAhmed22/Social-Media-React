import React, { useState, useRef } from "react";
import { useUpdateProfile } from "../../../../store/user/user.slice";
import upload from "../../../../upload";
import "./EditModal.scss";

function EditProfileModal({ profile, userId, onClose }) {
  const [form, setForm] = useState({
    username: profile.username || "",
    displayName: profile.displayName || "",
    bio: profile.bio || "",
    avatarUrl: profile.avatarUrl || "",
    backgroundUrl: profile.backgroundUrl || "",
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(profile.avatarUrl || "");
  const [bgFile, setBgFile] = useState(null);
  const [bgPreview, setBgPreview] = useState(profile.backgroundUrl || "");
  const [uploading, setUploading] = useState(false);

  const avatarRef = useRef(null);
  const bgRef = useRef(null);
  const overlayRef = useRef(null);

  const updateMutation = useUpdateProfile(userId);

  const handleOverlay = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleBgChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBgFile(file);
    setBgPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      const body = { ...form };

      if (avatarFile) {
        body.avatarUrl = await upload(avatarFile);
      }
      if (bgFile) {
        body.backgroundUrl = await upload(bgFile);
      }

      await updateMutation.mutateAsync(body);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const isLoading = uploading || updateMutation.isPending;

  return (
    <div
      className="edit-modal-overlay"
      ref={overlayRef}
      onClick={handleOverlay}
    >
      <div className="edit-modal">
        <div className="edit-modal__header">
          <h3 className="edit-modal__title">Edit Profile</h3>
          <button className="edit-modal__close" onClick={onClose}>
            ✕
          </button>
        </div>

        <form className="edit-modal__form" onSubmit={handleSubmit}>
          {/* Background photo */}
          <div
            className="edit-modal__bg-preview"
            style={bgPreview ? { backgroundImage: `url(${bgPreview})` } : {}}
            onClick={() => bgRef.current?.click()}
          >
            <span className="edit-modal__bg-label">Change cover photo</span>
            <input
              ref={bgRef}
              type="file"
              accept="image/*"
              className="edit-modal__file-hidden"
              onChange={handleBgChange}
            />
          </div>

          {/* Avatar */}
          <div className="edit-modal__avatar-row">
            <div
              className="edit-modal__avatar-wrap"
              onClick={() => avatarRef.current?.click()}
            >
              <img
                className="edit-modal__avatar"
                src={
                  avatarPreview ||
                  `https://ui-avatars.com/api/?name=${form.username}&background=random`
                }
                alt="avatar"
              />
              <div className="edit-modal__avatar-overlay">📷</div>
              <input
                ref={avatarRef}
                type="file"
                accept="image/*"
                className="edit-modal__file-hidden"
                onChange={handleAvatarChange}
              />
            </div>
          </div>

          {/* Fields */}
          <div className="edit-modal__fields">
            <label className="edit-modal__label">
              Username
              <input
                className="edit-modal__input"
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="username"
                autoComplete="off"
              />
            </label>

            <label className="edit-modal__label">
              Display Name
              <input
                className="edit-modal__input"
                name="displayName"
                value={form.displayName}
                onChange={handleChange}
                placeholder="Display name"
              />
            </label>

            <label className="edit-modal__label">
              Bio
              <textarea
                className="edit-modal__textarea"
                name="bio"
                value={form.bio}
                onChange={handleChange}
                placeholder="Write something about yourself..."
                rows={3}
              />
            </label>
          </div>

          {updateMutation.isError && (
            <p className="edit-modal__error">
              {updateMutation.error?.response?.data?.message ||
                "Something went wrong."}
            </p>
          )}

          <div className="edit-modal__footer">
            <button
              type="button"
              className="btn btn--outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProfileModal;
