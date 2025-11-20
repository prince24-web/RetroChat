import styled from "styled-components";
import { useState } from "react";

export default function FileUploader({ user, supabase, onUploadSuccess }) {
  const [uploading, setUploading] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  
  // 🧠 Extract text from PDF using CDN version
  const extractTextFromPDF = async (pdfFile) => {
    try {
      // Load PDF.js from CDN if not already loaded
      if (!window.pdfjsLib) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        document.head.appendChild(script);
        
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
        });
      }

      const pdfjsLib = window.pdfjsLib;
      
      // Set worker
      pdfjsLib.GlobalWorkerOptions.workerSrc = 
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      const docs = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map((item) => item.str);
        const pageText = strings.join(" ");
        docs.push({
          pageContent: pageText,
          metadata: { pageNumber: i, fileName: pdfFile.name },
        });
      }
      console.log("📘 Extracted pages:", docs.length);
      return docs;
    } catch (error) {
      console.error("Error extracting PDF text:", error);
      throw new Error("Failed to extract text from PDF");
    }
  };

  // Upload PDF
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !user) {
      if (!user) setErrorMsg("User not authenticated");
      return;
    }
  
    setUploading(true);
    setErrorMsg(null);

    const filePath = `${user.id}/${Date.now()}-${file.name}`;
    console.log('📁 Attempting upload to path:', filePath);

    try {
      // 🧠 Extract text FIRST (before uploading)
      console.log("📂 Reading PDF:", file.name);
      const docs = await extractTextFromPDF(file);

      if (!docs.length) {
        setErrorMsg("Failed to extract text from PDF.");
        setUploading(false);
        return;
      }

      // --- Upload to Supabase Storage ---
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('pdfs')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ Storage upload error:', uploadError);
        setErrorMsg(`Storage upload failed: ${uploadError.message}`);
        setUploading(false);
        return;
      }

      console.log('✅ Storage upload successful:', uploadData);

      // --- Save metadata to database ---
      const { data: insertData, error: insertError } = await supabase
        .from('pdf_files')
        .insert([
          {
            user_id: user.id,
            name: file.name,
            path: filePath
          }
        ])
        .select();

      if (insertError) {
        console.error('❌ Database insert error:', insertError);
        setErrorMsg(`Database insert failed: ${insertError.message}`);
        setUploading(false);
        return;
      }

      console.log('✅ Database insert successful:', insertData);

      // 🚀 Send to embedding API
      console.log("🚀 Sending docs to /api/embed...");
      const res = await fetch("/api/embed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docs,
          pdfId: insertData[0].id,
          filePath
        }),
      });

      const data = await res.json();
      console.log("✅ Embed response:", data);

      if (!res.ok) {
        setErrorMsg("Embedding failed: " + data.error);
      } else {
        setErrorMsg(null);
        // Call the callback to refresh PDFs in parent
        if (onUploadSuccess) {
          onUploadSuccess();
        }
        alert("PDF uploaded and embedded successfully! ✅");
      }
    } catch (err) {
      console.error('❌ Unexpected error:', err);
      setErrorMsg(`Error: ${err.message || 'Unexpected upload error'}`);
    } finally {
      setUploading(false);
      // Reset file input
      e.target.value = '';
    }
  };

  return (
    <StyledWrapper>
      <div className="upload-container">
        <div className="folder">
          <div className="front-side">
            <div className="tip" />
            <div className="cover" />
          </div>
          <div className="back-side cover" />
        </div>
        <label className="custom-file-upload">
          <input 
            type="file"
            accept="application/pdf"
            onChange={handleUpload}
            disabled={uploading}
            className="title" 
          />
          {uploading ? 'Uploading...' : 'Upload a PDF'}
        </label>

        {errorMsg && (
          <p className="error-message">{errorMsg}</p>
        )}
      </div>
    </StyledWrapper>
  )
}

const StyledWrapper = styled.div`
  .upload-container {
    --transition: 350ms;
    --folder-W: 120px;
    --folder-H: 80px;
    width:12rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    padding: 10px;
    background: linear-gradient(135deg, #2d3748, #4a5568);
    border-radius: 15px;
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
    height: calc(var(--folder-H) * 1.7);
    position: relative;
    margin-bottom: 2rem;
  }

  .folder {
    position: absolute;
    top: -20px;
    left: calc(50% - 60px);
    animation: float 2.5s infinite ease-in-out;
    transition: transform var(--transition) ease;
  }

  .folder:hover {
    transform: scale(1.05);
  }

  .folder .front-side,
  .folder .back-side {
    position: absolute;
    transition: transform var(--transition);
    transform-origin: bottom center;
  }

  .folder .back-side::before,
  .folder .back-side::after {
    content: "";
    display: block;
    background-color: #e2e8f0;
    opacity: 0.5;
    z-index: 0;
    width: var(--folder-W);
    height: var(--folder-H);
    position: absolute;
    transform-origin: bottom center;
    border-radius: 15px;
    transition: transform 350ms;
    z-index: 0;
  }

  .upload-container:hover .back-side::before {
    transform: rotateX(-5deg) skewX(5deg);
  }
  .upload-container:hover .back-side::after {
    transform: rotateX(-15deg) skewX(12deg);
  }

  .folder .front-side {
    z-index: 1;
  }

  .upload-container:hover .front-side {
    transform: rotateX(-40deg) skewX(15deg);
  }

  .folder .tip {
    background: linear-gradient(135deg, #718096, #4a5568);
    width: 80px;
    height: 20px;
    border-radius: 12px 12px 0 0;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    position: absolute;
    top: -10px;
    z-index: 2;
  }

  .folder .cover {
    background: linear-gradient(135deg, #cbd5e0, #a0aec0);
    width: var(--folder-W);
    height: var(--folder-H);
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
    border-radius: 10px;
  }

  .custom-file-upload {
    font-size: 0.8em;
    color: #ffffff;
    text-align: center;
    background: rgba(255, 255, 255, 0.2);
    border: none;
    border-radius: 10px;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    transition: background var(--transition) ease;
    display: inline-block;
    width: 100%;
    height: 40px;
    padding: 10px 35px;
    position: relative;
  }

  .custom-file-upload:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  .custom-file-upload input[type="file"] {
    display: none;
  }

  .custom-file-upload input[type="file"]:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  .error-message {
    color: #e53e3e;
    margin-top: 1rem;
    font-weight: 500;
    text-align: center;
    font-size: 0.75rem;
  }

  @keyframes float {
    0% {
      transform: translateY(0px);
    }

    50% {
      transform: translateY(-20px);
    }

    100% {
      transform: translateY(0px);
    }
  }
`