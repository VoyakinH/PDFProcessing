const im = require("imagemagick");
const fs = require("fs");
const path = require('path');

function convert(args){
    return new Promise((resolve, reject) => {
        im.convert(
            args,
            0,
            (err, stdout) => {
                if (err) {
                    console.log(err);
                    reject(err)
                }
                resolve(stdout);
            });
    })
}

function getFileSize(fileName){
    return new Promise((resolve, reject) => {
        im.identify(
            ['-format', '%B', path.join(__dirname, "..", "converted", fileName + '.png')],
            function(err, output){
                if (err) {
                    console.log(err);
                    reject(err);
                }
                resolve(output);
            });
    })
}

module.exports.pdfConvertToPngAdjustFileSize =
    async function pdfConvertToPngAdjustFileSize(fileName,
                                                 maxDensity,
                                                 maxFileSize,
                                                 colorDepth,
                                                 appendDirection,
                                                 transparentBackground,
                                                 grayscale){
    let low = 10;
    let high = maxDensity;
    let mid = high;
    while (low <= high) {
        console.log(`${fileName} trying density: ${mid}`);
        try {
            await convert([
                '-limit', 'memory', '64',
                '-density', `${mid}`,
                path.join(__dirname, "..", "uploads", fileName + '.pdf'),
                '-strip',
                `${appendDirection ? '+' : '-'}append`,
                '-alpha', `${transparentBackground ? 'background' : 'remove'}`,
                '-colorspace', `${grayscale ? 'Gray' : 'sRGB'}`,
                '-depth', `${colorDepth}`,
                '-quality', '92',
                path.join(__dirname, "..", "converted", fileName + '.png')
            ]);
        } catch (error) {
            console.log(error);
            fs.cp(path.join(__dirname, "..", "uploads", 'error.png'), path.join(__dirname, "..", "converted", fileName + '-done.png'), ()=>{});
            return;
        }
        let midVal = await getFileSize(fileName);
        let difference = maxFileSize - midVal;
        if (difference >= 0 && (mid === 300 || difference <= 32768)) {
            break;
        }
        if (midVal > maxFileSize) {
            high = mid - 1;
        } else {
            low = mid + 1;
        }
        mid = Math.floor((low + high) / 2);
    }
    fs.renameSync(path.join(__dirname, "..", "converted", fileName + '.png'), path.join(__dirname, "..", "converted", fileName + '-done.png'));
    console.log(fileName, 'converted');
}

module.exports.pdfConvertToPngSpecificDensity =
    async function pdfConvertToPngSpecificDensity(fileName,
                                                 density,
                                                 colorDepth,
                                                 appendDirection,
                                                 transparentBackground,
                                                 grayscale){
    console.log(`${fileName} converting with density: ${density}`);
    try {
        await convert([
            '-limit', 'memory', '64',
            '-density', `${density}`,
            path.join(__dirname, "..", "uploads", fileName + '.pdf'),
            '-strip',
            `${appendDirection ? '+' : '-'}append`,
            '-alpha', `${transparentBackground ? 'background' : 'remove'}`,
            '-colorspace', `${grayscale ? 'Gray' : 'sRGB'}`,
            '-depth', `${colorDepth}`,
            '-quality', '92',
            path.join(__dirname, "..", "converted", fileName + '.png')
        ]);
    } catch (error) {
        console.log(error);
        fs.cp(path.join(__dirname, "..", "uploads", 'error.png'), path.join(__dirname, "..", "converted", fileName + '-done.png'), ()=>{});
        return;
    }
    fs.renameSync(path.join(__dirname, "..", "converted", fileName + '.png'), path.join(__dirname, "..", "converted", fileName + '-done.png'));
    console.log(fileName, 'converted');
}
