import React, { createContext, useContext, useState } from "react";
import "./GlobalModal.scss";

const ModalContext = createContext();

export const useModal = () => useContext(ModalContext);

export const ModalProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);

  const openModal = (content) => {
    setModalContent(content);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setModalContent(null);
  };

  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      {children}
      {isOpen && (
        <div className="global-modal-overlay" onClick={closeModal}>
          <div className="global-modal" onClick={(e) => e.stopPropagation()}>
            {modalContent}
            <button className="close-btn" onClick={closeModal}>
              ×
            </button>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
};
