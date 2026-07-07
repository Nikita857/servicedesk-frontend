export function fioToUsername(fio: string): string {
    if (!fio.trim()) return "";
    const parts = fio.trim().split(/\s+/);           // split по любым пробелам
    const last = parts[0];                            // фамилия
    const first = parts[1];                           // имя
    const middle = parts[2];                          // отчество (может не быть)

    const base = transliterate(last);
    if (!first) return base;                          // только одно слово

    const initials = transliterate(first[0]) + (middle ? transliterate(middle[0]) : "");
    return `${base}_${initials}`;
}


function transliterate(text: string): string {
    const CYR_TO_LAT: Record<string, string> = {
        'а': 'a', 'б': 'b', 'в': 'v',
        'г': 'g', 'д': 'd', 'е': 'e',
        'ё': 'yo', 'ж': 'zh', 'з': 'z',
        'и': 'i', 'й': 'j', 'к': 'k',
        'л': 'l', 'м': 'm', 'н': 'n',
        'о': 'o', 'п': 'p', 'р': 'r',
        'с': 's', 'т': 't', 'у': 'u',
        'ф': 'f', 'х': 'kh', 'ц': 'ts',
        'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
        'ъ': '', 'ы': 'y', 'ь': '',
        'э': 'e', 'ю': 'yu', 'я': 'ya',
    };
    return text
        .toLowerCase()
        .split('')
        .map(char => CYR_TO_LAT[char] ?? char)
        .join('');

}
