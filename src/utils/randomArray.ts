function generateRandomArray(size: number, min?: number, max?: number): number[]{
    const arr: number[] = [];

    for (let i = 0; i < size; i++){
        const randomNum = Math.floor(Math.random() * (max! - min! + 1)) + min!;
        arr.push(randomNum);
    }
    return arr;
}