import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ImageDropzone } from "@/features/studio/components/ImageDropzone";

const fileOfType = (type: string, name: string) => new File(["fake-bytes"], name, { type });

describe("ImageDropzone", () => {
  it("passes accepted images to the callback", () => {
    const onFileAccepted = vi.fn();
    render(<ImageDropzone onFileAccepted={onFileAccepted} />);
    const file = fileOfType("image/png", "lamp.png");

    fireEvent.change(screen.getByLabelText("Upload product photo"), { target: { files: [file] } });

    expect(onFileAccepted).toHaveBeenCalledWith(file);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("rejects unsupported files with an inline error", () => {
    const onFileAccepted = vi.fn();
    render(<ImageDropzone onFileAccepted={onFileAccepted} />);

    fireEvent.drop(screen.getByRole("button"), {
      dataTransfer: { files: [fileOfType("application/pdf", "invoice.pdf")] },
    });

    expect(onFileAccepted).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Only JPEG, PNG and WebP images are supported.");
  });

  it("opens the file picker from the keyboard", () => {
    render(<ImageDropzone onFileAccepted={vi.fn()} />);
    const input = screen.getByLabelText<HTMLInputElement>("Upload product photo");
    const clickSpy = vi.spyOn(input, "click");

    fireEvent.keyDown(screen.getByRole("button"), { key: "Enter" });

    expect(clickSpy).toHaveBeenCalledOnce();
  });
});
