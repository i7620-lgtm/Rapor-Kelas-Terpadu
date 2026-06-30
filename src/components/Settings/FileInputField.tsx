import React from 'react';
import { Upload, Trash2 } from 'lucide-react';

interface FileInputFieldProps {
    label: string;
    id: string;
    onChange: (e: any) => void;
    onSave: () => void;
    imagePreview: string | null;
    onMakeTransparent: (id: string) => void;
    containerClassName?: string;
}

export const FileInputField: React.FC<FileInputFieldProps> = ({ 
    label, 
    id, 
    onChange, 
    onSave, 
    imagePreview, 
    onMakeTransparent, 
    containerClassName 
}) => {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                onChange({ target: { name: id, value: base64String, type: 'file_upload' } });
                onSave();
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemove = () => {
        onChange({ target: { name: id, value: null, type: 'remove_image' } });
        onSave();
    };
    
    return (
     React.createElement('div', { className: `w-full flex flex-col text-left ${containerClassName || ''}` },
        React.createElement('label', { className: "block text-sm font-medium text-slate-700 mb-1" },
            label
        ),
        React.createElement('div', { className: "mt-1 flex flex-col gap-2 p-2 border-2 border-slate-300 border-dashed rounded-md flex-grow" },
            React.createElement('div', { className: "flex items-center gap-4 flex-grow" },
                imagePreview && !imagePreview.includes('fakepath') ? (
                    React.createElement('img', { src: imagePreview, alt: "Preview", className: `${id.includes('ttd') ? 'w-32' : 'w-16'} h-16 object-contain rounded-md bg-transparent` })
                ) : (
                    React.createElement('div', { className: "w-16 h-16 bg-slate-100 rounded-md flex items-center justify-center text-slate-400 text-xs text-center" }, "Pratinjau")
                ),
                React.createElement('div', { className: "text-center flex-1 space-y-2" },
                    imagePreview ? (
                        React.createElement('div', { className: "flex justify-center items-center gap-6" },
                            React.createElement('label', { htmlFor: String(id), className: "cursor-pointer p-2 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 hover:text-indigo-700 transition-colors tooltip", title: "Ubah Gambar" },
                                React.createElement(Upload, { size: 18 }),
                                React.createElement('input', { id: String(id), name: String(id), type: "file", className: "sr-only", onChange: handleFileChange, accept: "image/*" })
                            ),
                            React.createElement('button', { onClick: handleRemove, className: "p-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100 hover:text-red-700 transition-colors tooltip", title: "Hapus Gambar" },
                                React.createElement(Trash2, { size: 18 })
                            )
                        )
                    ) : (
                        React.createElement('div', { className: "flex text-sm text-slate-600 justify-center" },
                            React.createElement('label', { htmlFor: String(id), className: "relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none" },
                                React.createElement('span', null, "Unggah file"),
                                React.createElement('input', { id: String(id), name: String(id), type: "file", className: "sr-only", onChange: handleFileChange, accept: "image/*" })
                            )
                        )
                    ),
                    React.createElement('p', { className: "text-xs text-slate-500" }, "Format PNG atau JPG")
                )
            ),
            imagePreview && (
                React.createElement('button', {
                    onClick: () => onMakeTransparent(id),
                    className: "w-full text-center py-1.5 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-md hover:bg-indigo-200 transition-colors"
                }, "Buat Transparan")
            )
        )
    )
    );
};
