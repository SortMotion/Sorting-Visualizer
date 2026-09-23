export function generateRandomArray(size: number, min: number  = 0, max: number = 100): number[]{
    if (size <= 0) { throw new Error("El tamaño del arreglo debe ser mayor a 0."); }
    if (min >= max) { throw new Error("El valor mínimo debe ser menor que el valor máximo."); }

    const arr: number[] = [];

    for (let i = 0; i < size; i++){
        const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
        arr.push(randomNum);
    }
    return arr;
}
