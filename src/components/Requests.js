import axios from "axios";

// Обработчик POST запроса
export const postRequestHandler = async (path, data, isFile=false) => {
    let result;
    let formData = new FormData();
    if (isFile) {
        for (let key in data) {
            formData.append(key, data[key]);
        }
    }
    await axios.post(
        `${process.env.REACT_APP_DOMAIN}:${process.env.REACT_APP_PORT}${path}`,
        isFile?
            formData:
            JSON.stringify(data),
        {
            withCredentials: false
        }
    )
        .then(response => {
            result = response
        })
        .catch(error => {
            result = error.response
        });
    return result
};