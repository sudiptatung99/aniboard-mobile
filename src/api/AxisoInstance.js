import axios from "axios";

export const BaseURL = "https://api.aniboard.com/api/";
export const MainURL = "https://v.aniboard.com/";
export const ImageURL = "https://v.aniboard.com";
export const ElementURL = "https://v.aniboard.com/SlideLargeVideo/dynamicimage/element/";

// https://aniboard.com/s/SlideLargeVideo/dynamicimage/element/salad1_1764484595426.png



export const Axios = axios.create({
    baseURL: BaseURL,
    headers: {
        'Content-Type': 'application/json',
    },
})


export const PrivateAxios = axios.create({
    baseURL: BaseURL,
    headers: {
        'Content-Type': 'application/json',
    },
})
// PrivateAxios.interceptors.request.use(
//     (config) => {
//         const token = sessionStorage.getItem('token');
//         if (token) {
//             config.headers['authentication'] = `${token}`;
//             config.headers['Content-Type'] = 'application/json';
//         }
//         return config;
//     },
//     (error) => {
//         return Promise.reject(error);
//     }
// );

export const PrivateAxiosFile = axios.create({
    baseURL: BaseURL,
    headers: {
        'Content-Type': 'multipart/form-data',
    },
});

