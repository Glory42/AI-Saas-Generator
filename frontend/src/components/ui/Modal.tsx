import { createPortal } from 'react-dom';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import type { ForwardRefRenderFunction, ReactNode } from 'react';
import Button from './Button';

interface ModalProps {
  children: ReactNode;
  buttonCaption?: string;
  className?: string;
  onClose?: () => void;
}

interface ModalHandle {
  open: () => void;
  close: () => void;
}

const Modal: ForwardRefRenderFunction<ModalHandle, ModalProps> = 
  function Modal({ children, buttonCaption = "Close", className = "", onClose }, ref) {
    const dialog = useRef<HTMLDialogElement>(null);

    useImperativeHandle(ref, () => ({
      open() {
        dialog.current?.showModal();
      },
      close() {
        dialog.current?.close();
      }
    }));
    
    const handleClose = () => {
      onClose?.();
      dialog.current?.close();
    };
    
    return createPortal(
      <dialog 
        ref={dialog} 
        className={`backdrop:bg-black/60 p-4 rounded-lg shadow-lg ${className}`}
        onCancel={handleClose}
      >
        {children}
        <form method="dialog" className="mt-4 text-right">
          <Button type="button" onClick={handleClose}>{buttonCaption}</Button>
        </form>
      </dialog>,
      document.getElementById("modal-root") as HTMLElement
    );
  };

export type { ModalHandle };
export default forwardRef(Modal);