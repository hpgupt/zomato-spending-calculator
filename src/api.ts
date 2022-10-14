interface costStruct {
    [key: string]: number
}

export const makeApiCalls = async (cookies: chrome.cookies.Cookie[]) => {
    try {
        const cookieMap: { [name: string]: string } = {};
        cookies.forEach(cookie => {
            cookieMap[cookie.name] = cookie.value;
        });
        const myHeaders = new Headers();
        myHeaders.append("authority", "www.zomato.com");
        myHeaders.append("sec-ch-ua", "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"99\", \"Google Chrome\";v=\"99\"");
        myHeaders.append("x-zomato-csrft", cookieMap?.csrf);
        myHeaders.append("sec-ch-ua-mobile", "?1");
        myHeaders.append("user-agent", "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.82 Mobile Safari/537.36");
        myHeaders.append("sec-ch-ua-platform", "\"Android\"");
        myHeaders.append("accept", "*/*");
        myHeaders.append("sec-fetch-site", "same-origin");
        myHeaders.append("sec-fetch-mode", "cors");
        myHeaders.append("sec-fetch-dest", "empty");
        myHeaders.append("accept-language", "en-US,en;q=0.9");
        myHeaders.append("cookie", `fbcity=${cookieMap?.fbcity}; fre=${cookieMap?.fre}; rd=${cookieMap?.rd}; zl=${cookieMap.zl}; fbtrack=${cookieMap?.fbtrack}; _ga=${cookieMap?._ga}; _gid=${cookieMap?._gid}; _gcl_au=${cookieMap?._gcl_au}; _fbp=${cookieMap?._fbp}; G_ENABLED_IDPS=${cookieMap?.G_ENABLED_IDPS}; zhli=${cookieMap?.zhli}; g_state=${cookieMap?.g_state}; ltv=${cookieMap?.ltv}; lty=${cookieMap?.lty}; locus=${cookieMap?.locus}; squeeze=${cookieMap?.squeeze}; orange=${cookieMap?.orange}; csrf=${cookieMap?.csrf}; PHPSESSID=${cookieMap?.PHPSESSID}; AWSALBTG=${cookieMap?.AWSALBTG}; AWSALBTGCORS=${cookieMap?.AWSALBTGCORS}; fre=${cookieMap?.fre}; rd=${cookieMap?.rd}; AWSALBTG=${cookieMap?.AWSALBTG}; AWSALBTGCORS=${cookieMap?.AWSALBTGCORS}`);

        const requestOptions: RequestInit = {
            method: 'GET',
            headers: myHeaders,
            redirect: 'follow'
        };

        const results: costStruct = {};
        const stopDate = await getStopDate();

        let stop = false;

        for (let index = 0; ; index++) {
            // const response = await fetch(`https://www.zomato.com/webroutes/user/orders?page=${page}`, requestOptions);
            if (stop) {
                break;
            }
            if (index > 1000) {
                break;
            }
            const pages = []; let count = 1;
            while (count <= 10) {
                pages.push(index * 10 + count);
                count++;
            }

            const batchData = await Promise.all(pages.map(async (page): Promise<[boolean,costStruct]>=> {
                let total: costStruct = {};
                const response = await fetchWrrapper(`https://www.zomato.com/webroutes/user/orders?page=${page}`, requestOptions);

                if (response === "") {
                    return [false, {}];
                }

                const data = JSON.parse(response)?.entities?.ORDER;
                if (JSON.stringify(data) === JSON.stringify([])) {
                    stop = true;
                    return [false, total];
                }

                for (const key in data) {
                    if (stopDate.getTime() > new Date().getTime()) {
                        if (data[key].paymentStatus) {
                            const [currency, amount] = separateCurrencyFromCost(data[key].totalCost);
                            total[currency] = (total[currency] || 0) + parseFloat(amount);
                        }
                    }
                    else {
                        const value = data[key];
                        const orderDate = new Date(value.orderDate.split("at")[0].trim());
                        if (orderDate.getTime() < stopDate.getTime()) {
                            stop = true;
                        }
                        else {
                            if (data[key].paymentStatus) {
                                const [currency, amount] = separateCurrencyFromCost(data[key].totalCost);
                                total[currency] = (total[currency] || 0) + parseFloat(amount);
                            }
                        }
                    }
                }

                return [true, total];
            }));

            batchData.forEach(data => {
                const [status, total] = data;
                if (status) {
                    for (const key in total) {
                        results[key] = (results[key] || 0) + total[key];
                    }
                }
            });
        }
        return results;
    }
    catch (e) {
        console.log(e);
        throw new Error("Error while making api calls to zomato");
    }
}

const getStopDate = async () => {
    let dateOption: string;
    const items = await chrome.storage.sync.get("dateOption");
    dateOption = items.dateOption;
    let stopDate: Date;
    const presentDay = new Date();

    switch (dateOption) {
        case "For All Time":
            stopDate = new Date(presentDay.getFullYear(), presentDay.getMonth(), presentDay.getDate() + 1);
            break;
        case "This Month":
            stopDate = new Date(presentDay.getFullYear(), presentDay.getMonth(), 1);
            break;
        case "This Year":
            stopDate = new Date(presentDay.getFullYear(), 0, 1);
            break;
        default:
            stopDate = new Date(presentDay.getFullYear(), presentDay.getMonth(), presentDay.getDate() + 1);
    }

    return stopDate;
}

const fetchWrrapper = async (url: string, options: RequestInit) => {
    return fetch(url, options).then(response => {
        return response.text();
    }).catch(_ => {
        return "";
    });
}

const separateCurrencyFromCost = (cost: string) => {
    const firstDigitIndex = cost.search(/\d/);
    const currency = cost.substring(0, firstDigitIndex).trim();
    const amount = cost.substring(firstDigitIndex).trim();
    return [currency, amount];
};