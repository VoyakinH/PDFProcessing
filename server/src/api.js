const express = require('express');
const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser');
const fs = require('fs');
const { v4: uuid } = require('uuid');
const pdfPng = require('./pdfToPngConverter');
const path = require("path");
require('dotenv').config();


const router = express.Router();

router.use(fileUpload({
    createParentPath: true
}));
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended: true}));

router.use((req, res, next) => {
    const allowedOrigins = process.env.REACT_APP_ALLOWED_DOMAINS.split(',');
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    next();
});


router.post('/v1/pdf/png/adjust', async (req, res) => {
    let fileUploaded = false;
    let fileGenName;
    try {
        if (!req.files) {
            res.send({
                status: false,
                message: 'No file uploaded'
            });
        } else if (!req.files.file || !req.body.props) {
            res.send({
                status: false,
                message: 'Invalid structure of request'
            });
        } else if (req.files.file.mimetype !== 'application/pdf') {
            res.send({
                status: false,
                message: 'Invalid file type'
            });
        } else {
            const file = req.files.file;
            fileGenName = uuid();

            await file.mv(path.join(__dirname, "..", "uploads", fileGenName + '.pdf'));
            fileUploaded = true;

            let props = JSON.parse(req.body.props);

            props.max_file_size = props.max_file_size.value * Math.pow(1024, props.max_file_size.unit + 1);

            pdfPng.pdfConvertToPngAdjustFileSize(
                fileGenName,
                props.density,
                props.max_file_size,
                props.color_depth,
                props.append_direction,
                props.transparent_background,
                props.grayscale
            ).then(() => {
                fs.rm(
                    path.join(__dirname, "..", "uploads", fileGenName + '.pdf'),
                    { recursive: false },
                    (_) => {}
                )
            });

            res.send({
                status: true,
                message: 'File is converting',
                fileGenName: fileGenName + '-done',
            });
        }
    } catch (err) {
        if (fileUploaded) {
            fs.rm(
                path.join(__dirname, "..", "uploads", fileGenName + '.pdf'),
                { recursive: false },
                (_) => {}
            )
        }
        res.status(500).send(err);
    }
})

router.post('/v1/pdf/png/specific', async (req, res) => {
    let fileUploaded = false;
    let fileGenName;
    try {
        if (!req.files) {
            res.send({
                status: false,
                message: 'No file uploaded'
            });
        } else if (!req.files.file || !req.body.props) {
            res.send({
                status: false,
                message: 'Invalid structure of request'
            });
        } else if (req.files.file.mimetype !== 'application/pdf') {
            res.send({
                status: false,
                message: 'Invalid file type'
            });
        } else {
            const file = req.files.file;
            fileGenName = uuid();

            await file.mv(path.join(__dirname, "..", "uploads", fileGenName + '.pdf'));
            fileUploaded = true;

            let props = JSON.parse(req.body.props);

            pdfPng.pdfConvertToPngSpecificDensity(
                fileGenName,
                props.density,
                props.color_depth,
                props.append_direction,
                props.transparent_background,
                props.grayscale
            ).then(() => {
                fs.rm(
                    path.join(__dirname, "..", "uploads", fileGenName + '.pdf'),
                    { recursive: false },
                    (_) => {}
                )
            });

            res.send({
                status: true,
                message: 'File is converting',
                fileGenName: fileGenName + '-done',
            });
        }
    } catch (err) {
        if (fileUploaded) {
            fs.rm(
                path.join(__dirname, "..", "uploads", fileGenName + '.pdf'),
                { recursive: false },
                (_) => {}
            )
        }
        res.status(500).send(err);
    }
})

router.post('/v1/pdf/png/status', async (req, res) => {
    try {
        if (!req.body.file_gen_name) {
            res.send({
                status: false,
                message: 'Invalid structure of request'
            });
        } else {
            const filePath = path.join(__dirname, "..", "converted", req.body.file_gen_name);
            if (fs.existsSync(filePath)) {
                const size = fs.statSync(filePath).size;

                res.send({
                    status: true,
                    message: 'File converted',
                    file_size: size
                });
            } else {
                res.send({
                    status: false,
                    message: 'File not found'
                });
            }
        }
    } catch (err) {
        res.status(500).send(err);
    }
})

module.exports = router;
