import { useState } from 'react';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("image", file); // Must match backend 'upload.single("image")'

    try {
      // CHANGE THIS URL TO YOUR LOCALHOST OR PRODUCTION URL
      const response = await fetch("http://localhost:5000/api/upload", {
        method: "POST",
        body: formData,
      });
      
      const data = await response.json();
      
      if (data.imageUrl) {
        setImageUrl(data.imageUrl);
        console.log("Uploaded!", data.imageUrl);
      }
    } catch (error) {
      console.error("Error uploading:", error);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-8">Day 2: Upload Test</h1>
      
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
        <input 
          type="file" 
          accept="image/*"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-400
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-indigo-600 file:text-white
            hover:file:bg-indigo-700
            mb-4"
        />

        <button 
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded transition"
        >
          {uploading ? "Uploading..." : "Upload to Cloudinary"}
        </button>

        {imageUrl && (
          <div className="mt-6">
            <p className="text-sm text-gray-400 mb-2">Result:</p>
            <img src={imageUrl} alt="Uploaded" className="w-full rounded border border-gray-600" />
            <a href={imageUrl} target="_blank" className="text-blue-400 text-xs mt-2 block break-all">{imageUrl}</a>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;