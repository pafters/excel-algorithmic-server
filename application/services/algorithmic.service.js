const stringSimilarity = require('string-similarity');

const fs = require('fs');

class AlgorithmicService {

    units = [
        'мм', 'милиметр', 'см', 'сантиметр', 'м', 'метр', 'км', 'километр', 'д', 'дюйм', 'дюймов', 'дюйма', '"',
        'мл', 'милилитр', 'л', 'литр', 'литров', 'литра', 'барель',
        'шт', 'штука', 'штук',
        'гр', 'грамм', 'кг', 'килограмм', 'т', 'тонн',
        'р', 'рубль', 'доллар', 'евро'
    ];

    alphabetMap = {
        "a": "а",
        "o": "о",
        "e": "е",
        "c": "с",
        "p": "р",
    };

    constructor() {}

    cleanString = (str) => {
        return str.toLowerCase().replace(/[^a-zA-Zа-яА-Я0-9\sёЁ]/g, '').trim();
    }

    getWordsArray = (str) => {
        return this.cleanString(str).split(/\s+/);
    }

    removeFileName = (str) => {
        let bracket = 0;
        for (let i = 0; i < str.length; i++) {
            const symb = str[str.length - i - 1];
            if (symb === ')')
                bracket += 1
            if (symb === '(') {
                bracket -= 1;
                if (bracket == 0) {
                    return str.substring(0, str.length - i - 2);
                }
            }
        }
    }

    removeIdentical = (products) => {
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

                // Удаляем подстроки, заключенные в круглые скобки с расширением ".xlsx"
                const trimmedProductWithoutBrackets = trimmedProduct.replace(/([^)]+.xlsx)/g, "").trim();

                // Разделяем слова в строке по пробелу и сортируем их в алфавитном порядке
                const sortedWords = trimmedProductWithoutBrackets.split(" ").sort().join(" ").trim();

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
        return { cashProducts, uniqueProductsArray, duplicates };
    }

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
        let { cashProducts, uniqueProductsArray, duplicates } = this.removeIdentical(products);
        console.log('1этап', products.length, uniqueProductsArray.length)
        console.log('Удалено записей 1 этап', products.length - uniqueProductsArray.length)
        // Получаем массив дубликатов из результата функции

        // Формируем строку для записи в файл
        let logText = 'Дубликаты:\n';
        duplicates.forEach((duplicate) => {
            logText += `Оригинал: ${duplicate.original} \nДубликат: ${duplicate.duplicate} \n\n`;
        });

        // Записываем строку в файл
        fs.writeFile('log.txt', logText, (err) => {
            if (err) {
                console.error(err);
            } else {
                console.log('Дубликаты успешно записаны в log.txt');
            }
        });
        return { cashProducts, uniqueProductsArray };
    }


    getGroups = (strings) => { //Распределить по секциям
        const sections = {};

        strings.forEach(async (str, i) => {
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
                const similarity = stringSimilarity.compareTwoStrings(key.toLowerCase(), prefix.trim().toLowerCase().split(' ').slice(0, wordCounts + 1).join(' '));
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

    getUnitListFromStr = (str) => {
        const words = str.split(' ');
        let result = [];

        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            let isDublicate = this.units.some((unit) => {
                return (word.toLowerCase().indexOf(unit) >= 0 && ((word.length > unit.length && !isNaN(parseInt(word[0]))) || word.length == unit.length)) &&
                    ((!isNaN(parseInt(word[0]))) || (!isNaN(parseInt(words[i - 1])) && isNaN(parseInt(word[0]))))
            });
            if (isDublicate) {
                if (!isNaN(parseInt(word[0])))
                    result.push(word);
                if (!isNaN(parseInt(words[i - 1])) && isNaN(parseInt(word[0])))
                    result.push(words[i - 1] + ' ' + word);
            }
        }

        return result.join(' ');
    }

    fileUpload = async (data) => {
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

    getNames(array) {
        return array.map(item => {
            if (item[2]) {
                return item[2];
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