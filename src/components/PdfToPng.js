import React, { useState, useEffect, useRef } from 'react';
import { Grid, Paper, TextField, Button, Typography,
     IconButton, FormControl, ToggleButton, ToggleButtonGroup, Checkbox, FormControlLabel, MenuItem, Select, Stack, Divider } from '@mui/material'
import { South, East, Add, Delete, FileDownload } from '@mui/icons-material';
import { PulseLoader } from "react-spinners";
import { useNavigate } from 'react-router-dom';

import { postRequestHandler } from "./Requests";

const maxFileSize = parseInt(process.env.REACT_APP_MAX_INPUT_FILE_SIZE);
const maxFileSizeBytes = maxFileSize * 1024 * 1024;

const PdfToPng = ({ setOpenAlert, setAlertType, setAlertMessage }) => {
    let navigate = useNavigate();

    const [convertedFiles, setConvertedFiles] = useState([]);
    const [trackingFiles, setTrackingFiles] = useState({});

    const [selectedFile, setSelectedFile] = useState(undefined);

    const [colorDepth, setColorDepth] = useState("8");
    const [appendDirection, setAppendDirection] = useState(0);
    const [transparentBackground, setTransparentBackground] = useState(false);
    const [grayscale, setGrayscale] = useState(false);

    const [density, setDensity] = useState("300");

    const [adjustFileSize, setAdjustFileSize] = useState(false);
    const [mfsValue, setMfsValue] = useState("1");
    const [mfsUnit, setMfsUnit] = useState(1);

    const [isUploading, setIsUploading] = useState(false);

    const changeFileConvertStatusRef = useRef();

    useEffect(() => {
        changeFileConvertStatusRef.current = changeFileConvertStatus;
    });


    useEffect(() => {
        let props = localStorage.getItem('pdfToPngProps');
        if (props) {
            props = JSON.parse(props);
            setColorDepth(props.colorDepth);
            setAppendDirection(props.appendDirection);
            setTransparentBackground(props.transparentBackground);
            setGrayscale(props.grayscale);
            setDensity(props.density);
            setAdjustFileSize(props.adjustFileSize);
            setMfsValue(props.mfsValue);
            setMfsUnit(props.mfsUnit);
        }
        let convertedFilesTemp = localStorage.getItem('convertedFiles');
        if (convertedFilesTemp) {
            convertedFilesTemp = JSON.parse(convertedFilesTemp);
            setConvertedFiles(convertedFilesTemp);
            setConvertedFilesUpdateStatusInterval(convertedFilesTemp);
        }
    }, []);


    const styles = {
        paperStyleConverterLinks: {
            padding :20,
            borderRadius: 15,
            position: 'absolute',
            top: '20px',
            left: '20px',
            bottom: '20px',
            width: 140,
            overflow: 'auto'
        },
        paperStyleConverter: {
            padding :20,
            borderRadius: 15,
            position: 'absolute',
            top: '50%',
            left: '50%',
            marginTop: -305,
            marginLeft: -160,
            width: 280,
            height: 570,
        },
        paperStyleHistory: {
            padding :20,
            borderRadius: 15,
            position: 'absolute',
            top: '20px',
            right: '20px',
            bottom: '20px',
            width: 250,
            overflow: 'auto'
        },
        iconStyle: {
            color:'rgba(255,0,0,0.51)',
            width: 50,
            height: 50,
            padding:'10px'
        },
        labelStyle: {
            marginBottom:'20px'
        },
        textFieldStyle: {
            marginBottom:'8px'
        },
        buttonLoginStyle: {
            position: 'absolute',
            borderRadius: 15,
            width: 280,
            bottom:'75px',
            left: '20px',
        },
        buttonRegistrationStyle: {
            position: 'absolute',
            borderRadius: 15,
            width: 280,
            bottom:'20px',
            left: '20px',
        },
    };

    const showBackendFailAlert = () => {
        setAlertType('error');
        setAlertMessage("Сервис временно недоступен. Попробуйте позднее.");
        setOpenAlert(true);
    }

    const saveConvertedFileName = (fileName, fileGenName) => {
        let date = new Date();
        date.setDate(date.getDate() + 5);
        let datePeople = date.toISOString().replace(/T.*/,'').split('-').reverse().join('.');
        let newFile = {
            expiryDate: date,
            expiryDatePeople: datePeople,
            fileName: fileName.slice(0, -4) + '.png',
            fileGenName: fileGenName + '.png',
            failed: false,
            converted: false
        }
        let files = localStorage.getItem('convertedFiles');
        if (files) {
            files = JSON.parse(files);
            files.unshift(newFile);
        } else {
            files = [newFile];
        }
        files = JSON.stringify(files);
        localStorage.setItem('convertedFiles', files);

        let convertedFilesTemp = convertedFiles;
        convertedFilesTemp.unshift(newFile);
        setConvertedFiles(convertedFilesTemp);
        setConvertedFilesUpdateStatusInterval(convertedFilesTemp);
    }

    const savePropsToLocalStorage = () => {
        let props = JSON.stringify({
            density: density,
            mfsValue: mfsValue,
            mfsUnit: mfsUnit,
            adjustFileSize: adjustFileSize,
            colorDepth: colorDepth,
            appendDirection: appendDirection,
            transparentBackground: transparentBackground,
            grayscale: grayscale
        })
        localStorage.setItem('pdfToPngProps', props);
    }

     const changeFileConvertStatus = (fileGenName, isFailed) => {
        let i = convertedFiles.findIndex((file) => file.fileGenName === fileGenName);
        if (i >= 0) {
            let convertedFilesTemp = convertedFiles;
            convertedFilesTemp[i].converted = true;
            convertedFilesTemp[i].failed = isFailed;
            setConvertedFiles([...convertedFilesTemp]);
            localStorage.setItem('convertedFiles', JSON.stringify(convertedFilesTemp));
        }

        let trackingFilesToDelete = trackingFiles;
        delete(trackingFilesToDelete[fileGenName]);
        setTrackingFiles(trackingFilesToDelete);
    }

    const fileSelectedHandler = (event) => {
        const selectedFileTemp = event.target.files[0];

        if (selectedFileTemp.size > maxFileSizeBytes) {
            setAlertType('error');
            setAlertMessage(`Максимальный размер прикрепляемого файла: ${maxFileSize} Мб.`);
            setOpenAlert(true);
            return;
        }
        if (selectedFileTemp.type !== 'application/pdf') {
            setAlertType('error');
            setAlertMessage(`Тип прикрепляемого файла должен быть PDF`);
            setOpenAlert(true);
            return;
        }

        setSelectedFile(selectedFileTemp);
    };

    const convertButtonHandler = async () => {
        let colorDepthInt = Math.abs(parseInt(colorDepth));
        let densityInt = Math.abs(parseInt(density));
        let mfsValueInt = Math.abs(parseInt(mfsValue));
        if (selectedFile === undefined) {
            setAlertType('error');
            setAlertMessage(`Необходимо прикрепить PDF файл`);
            setOpenAlert(true);
            return;
        }
        if (!colorDepthInt || (colorDepthInt !== +colorDepth) || (colorDepthInt < 1) || (colorDepthInt > 64)) {
            setAlertType('error');
            setAlertMessage(`Необходимо указать глубину цвета от 1 до 64 бит`);
            setOpenAlert(true);
            return;
        }
        if (!densityInt || (densityInt !== +density) || (densityInt < 10) || (densityInt > 600)) {
            setAlertType('error');
            setAlertMessage(`Необходимо указать плотность пикселей от 10 до 600`);
            setOpenAlert(true);
            return;
        }
        if (!mfsValueInt || (mfsValueInt !== +mfsValue) || (mfsValueInt < 1) || (mfsUnit === 1 && mfsValueInt > 256) || (mfsUnit === 0 && mfsValueInt > 256 * 1024)) {
            setAlertType('error');
            setAlertMessage(`Необходимо указать максимальный размер файла от 1 КБ до 256 МБ`);
            setOpenAlert(true);
        }
        const fileName = selectedFile.name;
        setIsUploading(true);

        savePropsToLocalStorage();

        if (adjustFileSize) {
            await postRequestHandler('/api/v1/pdf/png/adjust',
                {
                    file: selectedFile,
                    props: JSON.stringify({
                        density: densityInt,
                        max_file_size: {
                            value: mfsValueInt,
                            unit: mfsUnit
                        },
                        color_depth: colorDepthInt,
                        append_direction: appendDirection,
                        transparent_background: transparentBackground,
                        grayscale: grayscale
                    })
                }, true)
                .then(response => {
                    switch (response.status) {
                        case 200:
                            if (response.data) {
                                saveConvertedFileName(fileName, response.data.fileGenName);
                            }
                            break;
                        default:
                            showBackendFailAlert()
                            console.log("/pdf/png/adjust 500.")
                    }
                })
        } else {
            await postRequestHandler('/api/v1/pdf/png/specific',
                {
                    file: selectedFile,
                    props: JSON.stringify({
                        density: densityInt,
                        color_depth: colorDepthInt,
                        append_direction: appendDirection,
                        transparent_background: transparentBackground,
                        grayscale: grayscale
                    })
                }, true)
                .then(response => {
                    switch (response?.status) {
                        case 200:
                            if (response.data) {
                                saveConvertedFileName(fileName, response.data.fileGenName);
                            }
                            break;
                        default:
                            showBackendFailAlert()
                            console.log("/pdf/png/specific 500.")
                            console.log(response)
                    }
                })
        }
        setIsUploading(false);
    };

    const setConvertedFilesUpdateStatusInterval = (convertedFilesTemp) => {
        let trackingFilesTemp = {};
        if (convertedFilesTemp !== []) {
            convertedFilesTemp.forEach((file) => {
                if (!file.converted && !trackingFiles[file.fileGenName]) {
                    trackingFilesTemp[file.fileGenName] = true;
                    let timerIdTemp = window.setInterval(() => {
                        let fileGenName = file.fileGenName;
                        let timerId = timerIdTemp;

                        postRequestHandler('/api/v1/pdf/png/status',
                            {file_gen_name: fileGenName},
                            true)
                            .then(response => {
                                switch (response.status) {
                                    case 200:
                                        if (response.data?.status === true) {
                                            changeFileConvertStatusRef.current(fileGenName, response.data?.file_size === 951);
                                            clearInterval(timerId);
                                        }
                                        break;
                                    default:
                                        console.log("/pdf/png/status 500.")
                                }
                            })

                    }, 5000);
                }
            })
        }
        setTrackingFiles({...trackingFiles, ...trackingFilesTemp});
    }

    const ConvertedFiles = () => {
        return (convertedFiles && convertedFiles.map((file) => (
            <Grid item sx={{ width: '100%' }} key={`fileGrid${file.fileGenName}`}>
                <Typography sx={{ fontSize: 14 }} color="text.secondary">
                    Название файла
                </Typography>
                <Typography variant="h6" component="div" mb={1}>
                    {file.fileName}
                </Typography>

                <Typography sx={{ fontSize: 14 }} color="text.secondary">
                    Доступен до
                </Typography>
                <Typography variant="h6" component="div" mb={1}>
                    {"" + file.expiryDatePeople}
                </Typography>


                <Typography sx={{ fontSize: 14 }} color="text.secondary">
                    Состояние
                </Typography>
                <Stack
                    direction="row"
                    justifyContent={file.converted ? "space-between" : "start"}
                    mb={1}
                >
                    <Typography variant="h6" component="div" mr={1}>
                        {file.converted ? (file.failed ? 'Ошибка' : (new Date(file.expiryDate) < Date()? 'Удалён' : 'Доступен')) : 'Обработка'}
                    </Typography>
                    {
                        file.converted ?
                            (
                                file.failed?
                                    <div></div> :
                                    <IconButton
                                        size="small"
                                        disabled={new Date(file.expiryDate) < Date()}
                                        sx={{
                                            height:34,
                                            borderRadius: 2,
                                            backgroundColor: 'rgba(24,117,255,0.1)'
                                        }}
                                        color='info'
                                    >
                                        <a href={`/converted/${file.fileGenName}`} target="_blank" rel="noreferrer" download={file.fileName}>
                                            <FileDownload />
                                        </a>
                                    </IconButton>
                            ) :
                            <PulseLoader speedMultiplier={1} color={"#000000"} size={6} style={{marginTop: '6px'}}/>
                    }
                </Stack>
                <Divider variant="middle" />
            </Grid>
        )))
    };

    return(
        <div>
            <Paper elevation={12} style={styles.paperStyleConverterLinks}>
                <Typography variant="h5" mb={1}>
                    Конвертеры
                </Typography>

                <Stack
                    direction="column"
                    alignItems="center"
                >
                    <IconButton
                        sx={{
                            borderRadius: 2,
                        }}
                        onClick={() => {
                            navigate("/pdftopng", {replace: true});
                        }}
                    >
                        <img src="pdfpng.png" alt="PDF to PNG"/>
                    </IconButton>

                    <Typography sx={{ fontSize: 14 }} color="text.secondary">
                        PDF в PNG
                    </Typography>
                </Stack>
            </Paper>

            <Paper elevation={12} style={styles.paperStyleConverter}>
                <Grid align='center'>
                    <Typography style={styles.labelStyle} variant="h5" gutterBottom>
                        PDF в PNG
                    </Typography>
                </Grid>

                <Stack
                    direction="column"
                >
                    <Stack
                        direction="row"
                        alignItems="center"
                    >
                        <Typography variant="h6" component="div" mr={1}>
                            Выбор файла
                        </Typography>

                        <IconButton
                            sx={{
                                borderRadius: 2,
                                backgroundColor: 'rgba(50, 200, 70, 0.3)'
                            }}
                            size="small"
                            color="success"
                            component="label"
                        >
                            <input
                                hidden
                                accept=".pdf"
                                type="file"
                                onChange={(event) => {
                                    fileSelectedHandler(event);
                                }}
                            />
                            <Add />
                        </IconButton>
                    </Stack>

                    <Typography sx={{ fontSize: 14 }} color="text.secondary" mb={1} mt={1}>
                        Имя файла: {selectedFile ? selectedFile.name : "Файл не выбран"}
                    </Typography>

                    <Typography variant="h6" component="div">
                        Параметры обработки
                    </Typography>

                    <TextField
                        style={styles.textFieldStyle}
                        onChange={(e) => {setColorDepth(e.target.value)}}
                        value={colorDepth}
                        fullWidth
                        required
                        variant="standard"
                        type='number'
                        label='Глубина цвета'
                    />

                    <Typography sx={{ fontSize: 14 }} color="text.secondary">
                        Направление склеивания
                    </Typography>

                    <ToggleButtonGroup
                        value={appendDirection}
                        exclusive
                        size="small"
                        onChange={(_, value) => {setAppendDirection(value)}}
                        aria-label="append direction"
                    >
                        <ToggleButton value={0} aria-label="vertival direction">
                            <South/>
                        </ToggleButton>
                        <ToggleButton value={1} aria-label="horizontal direction">
                            <East/>
                        </ToggleButton>
                    </ToggleButtonGroup>

                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={transparentBackground}
                                onChange={(e) => {setTransparentBackground(e.target.checked)}}
                                inputProps={{ 'aria-label': 'transparent background' }}
                            />
                        }
                        label="Прозрачный фон"
                    />

                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={grayscale}
                                onChange={(e) => {setGrayscale(e.target.checked)}}
                                inputProps={{ 'aria-label': 'grayscale' }}
                            />
                        }
                        label="Чёрно-белый"
                    />

                    <TextField
                        style={styles.textFieldStyle}
                        onChange={(e) => {setDensity(e.target.value === "" ? "" : +e.target.value)}}
                        value={density}
                        fullWidth
                        required
                        variant="standard"
                        type='number'
                        label={adjustFileSize ? 'Желаемая плотность пикселей' : 'Плотность пикселей'}
                    />

                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={adjustFileSize}
                                onChange={(e) => {setAdjustFileSize(e.target.checked)}}
                                inputProps={{ 'aria-label': 'adjust file size' }}
                            />
                        }
                        label="Ограничить размер PNG"
                    />

                    <Stack
                        direction="row"
                        alignItems="center"
                    >
                        <TextField
                            disabled={!adjustFileSize}
                            onChange={(e) => {setMfsValue(e.target.value === "" ? "" : +e.target.value)}}
                            value={mfsValue}
                            fullWidth
                            required={adjustFileSize}
                            variant="standard"
                            type='number'
                        />

                        <FormControl variant="standard" sx={{ ml: 1, width: '70px' }}>
                            <Select
                                id="max-file-size-units"
                                value={mfsUnit}
                                disabled={!adjustFileSize}
                                required={adjustFileSize}
                                onChange={(e) => {setMfsUnit(e.target.value)}}
                            >
                                <MenuItem value={0}>КБ</MenuItem>
                                <MenuItem value={1}>МБ</MenuItem>
                            </Select>
                        </FormControl>
                    </Stack>

                    <Button
                        style={styles.buttonRegistrationStyle}
                        onClick={convertButtonHandler}
                        disabled={isUploading}
                        fullWidth
                        color='primary'
                        variant='outlined'
                    >
                        {
                            isUploading ?
                                <div><PulseLoader speedMultiplier={1} color={"#072fa9"} size={6}/></div> :
                                'Конвертировать'
                        }
                    </Button>
                </Stack>
            </Paper>


            <Paper elevation={12} style={styles.paperStyleHistory}>
                <Stack
                    direction="row"
                    justifyContent="space-between"
                    mb={2}
                >
                    <Typography variant="h5">
                        История
                    </Typography>

                    <IconButton
                        size="small"
                        sx={{
                            borderRadius: 2,
                            backgroundColor: 'rgba(255,80,80,0.1)'
                        }}
                        color='error'
                        onClick={() => {
                            localStorage.removeItem('convertedFiles');
                            setConvertedFiles([]);
                        }}
                    >
                        <Delete/>
                    </IconButton>
                </Stack>

                <Grid container spacing={2} justifyContent="flex-start">
                    {convertedFiles === [] ?
                        <Grid item sx={{ width: '100%' }} key={`fileGridEmpty`}>
                            <Typography
                                sx={{ fontSize: 14 }}
                                color="text.secondary"
                            >
                                Нет доступных файлов
                            </Typography>
                        </Grid>:
                        <ConvertedFiles/>
                    }
                </Grid>
            </Paper>
        </div>
    );
}

export default PdfToPng;
