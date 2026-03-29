import React, { useState, useEffect } from 'react';

const LockScreen = ({ appLock, onUnlock }) => {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [attempts, setAttempts] = useState(0);
    const [showRecovery, setShowRecovery] = useState(false);
    const [securityAnswer, setSecurityAnswer] = useState('');
    const [recoveryError, setRecoveryError] = useState('');

    useEffect(() => {
        if (pin.length === 6) {
            handleUnlock();
        }
    }, [pin]);

    const handleUnlock = () => {
        if (pin === appLock.pin) {
            setError('');
            onUnlock();
        } else {
            setError('PIN salah. Silakan coba lagi.');
            setPin('');
            setAttempts(prev => prev + 1);
        }
    };

    const handleNumpadClick = (num) => {
        if (pin.length < 6) {
            setPin(prev => prev + num);
            setError('');
        }
    };

    const handleDelete = () => {
        setPin(prev => prev.slice(0, -1));
        setError('');
    };

    const handleRecoverySubmit = (e) => {
        e.preventDefault();
        if (securityAnswer.toLowerCase().trim() === (appLock.securityAnswer || '').toLowerCase().trim()) {
            setRecoveryError('');
            onUnlock(); // Unlock if answer is correct
        } else {
            setRecoveryError('Jawaban salah.');
        }
    };

    if (showRecovery) {
        return (
            React.createElement('div', { className: "fixed inset-0 z-[9999] bg-slate-100 flex flex-col items-center justify-center p-4 overflow-hidden" },
                React.createElement('div', { className: "bg-white p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200 max-h-full overflow-y-auto" },
                    React.createElement('div', { className: "text-center mb-6" },
                        React.createElement('h2', { className: "text-xl sm:text-2xl font-bold text-indigo-600 mb-2" }, "Pemulihan PIN"),
                        React.createElement('p', { className: "text-xs sm:text-sm text-slate-500" }, "Jawab pertanyaan keamanan berikut untuk masuk.")
                    ),
                    React.createElement('form', { onSubmit: handleRecoverySubmit, className: "space-y-4" },
                        React.createElement('div', null,
                            React.createElement('label', { className: "block text-sm font-medium text-slate-700 mb-1" }, "Pertanyaan Keamanan:"),
                            React.createElement('p', { className: "p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 font-medium" }, appLock.securityQuestion || 'Tidak ada pertanyaan keamanan yang diatur.')
                        ),
                        React.createElement('div', null,
                            React.createElement('label', { className: "block text-sm font-medium text-slate-700 mb-1" }, "Jawaban Anda:"),
                            React.createElement('input', {
                                type: "text",
                                value: securityAnswer,
                                onChange: (e) => setSecurityAnswer(e.target.value),
                                className: "w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500",
                                placeholder: "Masukkan jawaban..."
                            })
                        ),
                        recoveryError && React.createElement('p', { className: "text-red-500 text-sm text-center" }, recoveryError),
                        React.createElement('div', { className: "flex gap-3 pt-4" },
                            React.createElement('button', {
                                type: "button",
                                onClick: () => { setShowRecovery(false); setSecurityAnswer(''); setRecoveryError(''); },
                                className: "flex-1 py-3 px-4 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors"
                            }, "Kembali"),
                            React.createElement('button', {
                                type: "submit",
                                className: "flex-1 py-3 px-4 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors"
                            }, "Verifikasi")
                        )
                    )
                )
            )
        );
    }

    return (
        React.createElement('div', { className: "fixed inset-0 z-[9999] bg-slate-100 flex flex-col items-center justify-center p-2 sm:p-4 overflow-hidden" },
            React.createElement('div', { className: "bg-white p-4 sm:p-6 rounded-3xl shadow-xl w-full max-w-sm flex flex-col items-center border border-slate-200 max-h-[95dvh] overflow-y-auto" },
                React.createElement('div', { className: "w-10 h-10 sm:w-14 sm:h-14 bg-indigo-100 rounded-full flex items-center justify-center mb-3 sm:mb-5 shrink-0" },
                    React.createElement('svg', { className: "w-5 h-5 sm:w-7 sm:h-7 text-indigo-600", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" },
                        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" })
                    )
                ),
                React.createElement('h2', { className: "text-lg sm:text-xl font-bold text-slate-800 mb-1 shrink-0" }, "Masukkan PIN"),
                React.createElement('p', { className: "text-[10px] sm:text-xs text-slate-500 mb-3 sm:mb-6 text-center shrink-0" }, "Aplikasi ini dikunci untuk melindungi data Anda."),
                
                React.createElement('div', { className: "flex gap-2 sm:gap-3 mb-3 sm:mb-6 shrink-0" },
                    [...Array(6)].map((_, i) => (
                        React.createElement('div', { 
                            key: i, 
                            className: `w-3 h-3 sm:w-4 sm:h-4 rounded-full transition-colors duration-200 ${i < pin.length ? 'bg-indigo-600' : 'bg-slate-200'}` 
                        })
                    ))
                ),

                error && React.createElement('p', { className: "text-red-500 text-xs sm:text-sm mb-2 sm:mb-4 text-center animate-pulse shrink-0" }, error),
                
                attempts >= 3 && appLock.hint && React.createElement('div', { className: "mb-3 sm:mb-5 p-2 bg-amber-50 border border-amber-200 rounded-lg w-full text-center shrink-0" },
                    React.createElement('p', { className: "text-[10px] sm:text-xs text-amber-600 font-semibold mb-1" }, "Petunjuk PIN:"),
                    React.createElement('p', { className: "text-[10px] sm:text-xs text-amber-800" }, appLock.hint)
                ),

                React.createElement('div', { 
                    className: "w-full max-w-[240px] mb-3 sm:mb-5 shrink-0",
                    style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem sm:gap-0.75rem', justifyItems: 'center' }
                },
                    [1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                        React.createElement('button', {
                            key: num,
                            onClick: () => handleNumpadClick(num.toString()),
                            className: "w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-50 hover:bg-slate-100 text-lg sm:text-xl font-semibold text-slate-700 flex items-center justify-center transition-colors active:bg-slate-200"
                        }, num)
                    )),
                    React.createElement('div', null), // Empty space
                    React.createElement('button', {
                        onClick: () => handleNumpadClick('0'),
                        className: "w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-50 hover:bg-slate-100 text-lg sm:text-xl font-semibold text-slate-700 flex items-center justify-center transition-colors active:bg-slate-200"
                    }, "0"),
                    React.createElement('button', {
                        onClick: handleDelete,
                        className: "w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-colors active:bg-slate-200"
                    }, 
                        React.createElement('svg', { className: "w-5 h-5 sm:w-6 sm:h-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" },
                            React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" })
                        )
                    )
                ),

                appLock.securityQuestion && React.createElement('button', {
                    onClick: () => setShowRecovery(true),
                    className: "text-xs sm:text-sm text-indigo-600 hover:text-indigo-800 font-medium shrink-0"
                }, "Lupa PIN?")
            )
        )
    );
};

export default LockScreen;
