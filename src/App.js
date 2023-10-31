import React, {useState} from 'react';
import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';
import {Alert, Snackbar} from "@mui/material";

import PdfToPng from './components/PdfToPng';

function App() {
    // Открыто ли уведомление
    const [openAlert, setOpenAlert] = useState(false);
    // Тип уведомления
    const [alertType, setAlertType] = useState('info');
    // Текст уведомления
    const [alertMessage, setAlertMessage] = useState("");

    // Обработчик закрытия уведомления
    const onCloseAlertClick = () => {
        setOpenAlert(false);
    };

    return (
        <div>
            <BrowserRouter>
                <Routes>
                    <Route path="/pdftopng" element={
                        <PdfToPng
                            setOpenAlert={setOpenAlert}
                            setAlertType={setAlertType}
                            setAlertMessage={setAlertMessage}
                        />
                    }/>

                    <Route path="*" element={<Navigate to="/pdftopng" />} />
                </Routes>
            </BrowserRouter>

            <Snackbar
                open={openAlert}
                autoHideDuration={6000}
                onClose={onCloseAlertClick}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={onCloseAlertClick}
                    severity={alertType}
                >
                    {alertMessage}
                </Alert>
            </Snackbar>
        </div>
    );
}

export default App;
