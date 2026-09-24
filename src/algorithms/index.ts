import { bubbleSort } from "./bubbleSort";
import { selectionSort } from "./selectionSort";
import { insertionSort } from "./insertionSort";
import { exchangeSort } from "./exchangeSort";
import { gnomeSort } from "./gnomeSort";
import { mergeSort } from "./mergeSort";
import { quickSort } from "./quickSort";
import { stoogeSort } from "./stoogeSort";
import type { SortAlgorithm } from "./types";

export const ALGORITHMS: SortAlgorithm[] = [
  bubbleSort, selectionSort, insertionSort, exchangeSort, gnomeSort, mergeSort, quickSort, stoogeSort,
];
