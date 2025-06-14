const stringSimilarity = require('string-similarity');

const fs = require('fs');

class AlgorithmicService {

    alphabetMap = {
        "a": "а", 's': 'с', 'k': 'к',
        'b': 'б', 'j': 'ж', 'i': 'и',
        'v': 'в', 'd': 'д', 'u': 'у',
        'п': 'г', 't': 'т', 'm': 'м',
        "o": "о", 'l': 'л', 'z': 'з',
        "e": "е", 'r': 'р', 'n': 'н',
        "c": "с", 'h': 'х',
        "p": "п", 'f': 'ф',
    };

    constructor() { }

    removeIdenticalByCash(cash, products) {
        const uniqueProductsArray = [];
        const uniqueProducts = {};
        const duplicates = [];
        const cashProducts = [];
        for (let i = 0; i < cash.length; i++) {
            if (cash[i]) {
                let hash = cash[i];
                if (!uniqueProducts.hasOwnProperty(hash)) {
                    uniqueProducts[hash] = i;
                    uniqueProductsArray.push(products[i]);
                    cashProducts.push(hash);
                    continue;
                }
                else {
                    // Если да, добавим в массив дубликатов информацию о дублирующейся записи.
                    duplicates.push({
                        original: products[i],
                        duplicate: products[uniqueProducts[hash]],
                    });
                }
            }
        }
        return { cashProducts, uniqueProductsArray, duplicates };
    }

    removeDuplicates = async (products) => {
        const uniqueProductsArray = [];

        const uniqueProducts = {};
        const duplicates = [];
        const cashProducts = [];

        // Таблица соответствия латинских и кириллических букв

        for (let i = 0; i < products.length; i++) {
            if (products[i]?.product_name) {
                let product = products[i].product_name;

                // Преобразуем строку в нижний регистр
                let canonicalProduct = product.toLowerCase();

                // Заменяем латинские буквы на кириллические и наоборот
                for (let letter in this.alphabetMap) {
                    canonicalProduct = canonicalProduct.replace(new RegExp(letter, "g"), this.alphabetMap[letter]);
                }

                // Удаляем лишние пробелы и другие символы
                const trimmedProduct = canonicalProduct.replace(/[^a-zA-Zа-яА-Я0-9ёЁ]/g, "").trim();

                // Разделяем слова в строке по пробелу и сортируем их в алфавитном порядке
                const sortedWords = trimmedProduct.split(" ").sort().join(" ").trim();

                // Проверим находится ли уже строка в массиве уникальных записей.
                if (!uniqueProducts.hasOwnProperty(sortedWords)) {
                    // Если нет, добавим продукт в объект и в новый массив uniqueProductsArray.
                    uniqueProducts[sortedWords] = i;
                    uniqueProductsArray.push(product);
                    cashProducts.push(sortedWords);
                    continue;
                } else {
                    // Если да, добавим в массив дубликатов информацию о дублирующейся записи.
                    duplicates.push({
                        original: product,
                        duplicate: products[uniqueProducts[sortedWords]].product_name,
                    });
                }
            }
        }
        console.log('1этап', products.length, uniqueProductsArray.length)
        console.log('Удалено записей 1 этап', products.length - uniqueProductsArray.length)
        let logText = 'Дубликаты:\n';
        duplicates.forEach((duplicate) => {
            logText += `Оригинал: ${duplicate.original} \nДубликат: ${duplicate.duplicate} \n\n`;
        });
        fs.writeFile('log.txt', logText, (err) => {
            if (err) {
                console.error(err);
            } else {
                console.log('Дубликаты успешно записаны в log.txt');
            }
        });
        return { cashProducts, uniqueProductsArray, duplicates };
    }


    getGroups = (strings) => { //Распределить по секциям
        const sections = {};

        strings.forEach((str, i) => {
            const step = 25;
            const addCountWords = str.length - step <= 0 ? 0 : Math.floor(1.5 * (str.length - step) / step);
            const numWords = 2 + addCountWords;
            const ban = ['#', '№'];
            const ban2 = ['м', 'мм', 'мл', 'л', 'хч', 'хх', 'х'];
            let words = [];
            words = str.split(' ').filter(word => !ban.some(symbol => word.includes(symbol)));

            let prefix = words.slice(0, numWords).join(' ')
                .replace(/[\s,%]/g, ' ')
                .replace(/[а-я]*\d+[А-Я]*/gi, '')
                .replace(/\b[\dх№]+\b/g, '')
                .replace(/\b\w{1,2}\b/g, '')
                .replace(/[^а-яА-Я\sёЁ]/g, ' ')
                .replace(/\s+/g, " ");

            const words2 = prefix.split(' ').filter(word => {
                return !ban2.some(bannedWord => word === bannedWord);
            });

            prefix = words2.slice(0, numWords).join(' ').trim();
            const sectionName = prefix.split(' ')[0].toLowerCase();

            if (!sections[sectionName]) {
                sections[sectionName] = {};
            }

            const keys = Object.keys(sections[sectionName]);
            let indexValue = null;

            keys.forEach((key, i) => {
                const wordCounts = key.toLowerCase().split(' ').length;
                const similarity = stringSimilarity.compareTwoStrings(key.toLowerCase(),
                    prefix.trim().toLowerCase().split(' ').slice(0, wordCounts + 1).join(' '));
                if (numWords <= 4 ? similarity > 0.85 : similarity > 0.9) {
                    indexValue = i;
                }
            });

            if (indexValue !== null) {
                sections[sectionName][keys[indexValue]].push(str);
            } else {
                sections[sectionName][prefix.trim()] = [str];
            }
        });

        console.log('Время конца распределения по группам: ', new Date().toLocaleTimeString());
        return sections;
    }

    handleTableData = async (data) => {
        let { cashProducts, uniqueProductsArray } = await this.removeDuplicates(data);
        const groups = this.getGroups(uniqueProductsArray);

        if (groups)
            return { msg: { groups, cash: { products_name: uniqueProductsArray, clean: cashProducts } }, status: 200 };
        else return { msg: { err: 'Ошибка обработки' }, status: 500 };
    }

    getProductNames(array, index = 2) {
        if (!index) {
            let maxLen = 0;
            for (let i = 0; i < 3; i++) {
                if (array[i].length > maxLen) {
                    maxLen = array[i].length;
                    for (let j = 0; j < array[i].length; j++) {
                        if (array[i][j]) {
                            index = j;
                            break;
                        }
                    }
                }
            }
        }
        return array.map(item => {
            if (item[index]) {
                return {
                    product_name: item[index]
                };
            }
        }).filter(item => item !== undefined);
    }

    addToMainTable = async (cash, products) => {
        const { cashProducts, uniqueProductsArray, duplicates } = this.removeIdenticalByCash(cash, products);
        console.log('Слияние', products.length, uniqueProductsArray.length)
        console.log('Удалено при слиянии', products.length - uniqueProductsArray.length)
        const groups = this.getGroups(uniqueProductsArray);
        if (groups)
            return { msg: { groups, cash: { products_name: uniqueProductsArray, clean: cashProducts } }, status: 200 };
        else return { msg: { err: 'Ошибка обработки' }, status: 500 };
    }

}

module.exports = new AlgorithmicService();