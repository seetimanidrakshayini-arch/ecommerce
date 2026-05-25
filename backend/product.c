#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
#include <ctype.h>
#include <strings.h>
#include "product.h"

Product catalog[MAX_PRODUCTS];
int     total_products = 0;

/* ── FILE I/O ── */
void load_products() {
    FILE *fp = fopen(DATA_FILE, "rb");
    if (!fp) { total_products = 0; return; }
    fread(&total_products, sizeof(int), 1, fp);
    fread(catalog, sizeof(Product), total_products, fp);
    fclose(fp);
}

void save_products() {
    FILE *fp = fopen(DATA_FILE, "wb");
    if (!fp) { printf("[ERROR] Cannot open data file.\n"); return; }
    fwrite(&total_products, sizeof(int), 1, fp);
    fwrite(catalog, sizeof(Product), total_products, fp);
    fclose(fp);
}

/* ── HELPERS ── */
static int next_id() {
    int max = 0;
    for (int i = 0; i < total_products; i++)
        if (catalog[i].active && catalog[i].id > max) max = catalog[i].id;
    return max + 1;
}

void print_separator() {
    printf("========== main menu=========\n");
}

void display_product(const Product *p) {
    printf("| %-6d | %-28s | %8.2f | %6.1f |\n",
           p->id, p->name, p->price, p->rating);
}

void display_all() {
    int found = 0;
    print_separator();
    printf("| %-6s | %-28s | %-8s | %-6s |\n",
           "ID", "Product Name", "Price", "Rating");
    print_separator();
    for (int i = 0; i < total_products; i++) {
        if (catalog[i].active) { display_product(&catalog[i]); found++; }
    }
    if (!found) printf("|              No products found.                       |\n");
    print_separator();
    printf("Total: %d product(s)\n\n", found);
}

/* ── CRUD ── */
int add_product(const char *name, float price, float rating) {
    if (total_products >= MAX_PRODUCTS) return -1;
    if (price < 0 || rating < 0 || rating > 5) return -2;
    Product *p = &catalog[total_products++];
    p->id = next_id();
    strncpy(p->name, name, MAX_NAME_LEN - 1);
    p->name[MAX_NAME_LEN - 1] = '\0';
    p->price  = price;
    p->rating = rating;
    p->active = 1;
    save_products();
    return p->id;
}

int update_product(int id, const char *name, float price, float rating) {
    if (price < 0 || rating < 0 || rating > 5) return -2;
    for (int i = 0; i < total_products; i++) {
        if (catalog[i].id == id && catalog[i].active) {
            if (strlen(name) > 0) strncpy(catalog[i].name, name, MAX_NAME_LEN - 1);
            if (price  >= 0) catalog[i].price  = price;
            if (rating >= 0) catalog[i].rating = rating;
            save_products();
            return 1;
        }
    }
    return 0;
}

int delete_product(int id) {
    for (int i = 0; i < total_products; i++) {
        if (catalog[i].id == id && catalog[i].active) {
            catalog[i].active = 0;
            save_products();
            return 1;
        }
    }
    return 0;
}

Product *find_by_id(int id) {
    for (int i = 0; i < total_products; i++)
        if (catalog[i].id == id && catalog[i].active) return &catalog[i];
    return NULL;
}

/* ── SEARCHING ── */

/* 1. Linear Search O(n) */
void linear_search(const char *keyword, Product *results[], int *count) {
    *count = 0;
    char kw[MAX_NAME_LEN], nm[MAX_NAME_LEN];
    int klen = strlen(keyword);
    for (int i = 0; i < klen; i++)
        kw[i] = (char)tolower((unsigned char)keyword[i]);
    kw[klen] = '\0';

    for (int i = 0; i < total_products; i++) {
        if (!catalog[i].active) continue;
        int nlen = strlen(catalog[i].name);
        for (int j = 0; j < nlen; j++)
            nm[j] = (char)tolower((unsigned char)catalog[i].name[j]);
        nm[nlen] = '\0';
        if (strstr(nm, kw)) results[(*count)++] = &catalog[i];
    }
}

/* 2. Binary Search by ID O(log n) */
Product *binary_search_by_id(int id) {
    static Product *temp[MAX_PRODUCTS];
    int n = 0;
    for (int i = 0; i < total_products; i++)
        if (catalog[i].active) temp[n++] = &catalog[i];
    /* sort by id */
    for (int i = 1; i < n; i++) {
        Product *key = temp[i]; int j = i - 1;
        while (j >= 0 && temp[j]->id > key->id) { temp[j+1] = temp[j]; j--; }
        temp[j+1] = key;
    }
    int lo = 0, hi = n - 1;
    while (lo <= hi) {
        int mid = (lo + hi) / 2;
        if (temp[mid]->id == id) return temp[mid];
        else if (temp[mid]->id < id) lo = mid + 1;
        else hi = mid - 1;
    }
    return NULL;
}

/* 3. Binary Search by Name Prefix O(log n) */
void binary_search_by_name(const char *keyword, Product *results[], int *count) {
    *count = 0;
    static Product *temp[MAX_PRODUCTS];
    int n = 0;
    for (int i = 0; i < total_products; i++)
        if (catalog[i].active) temp[n++] = &catalog[i];
    for (int i = 1; i < n; i++) {
        Product *key = temp[i]; int j = i - 1;
        while (j >= 0 && strcasecmp(temp[j]->name, key->name) > 0) {
            temp[j+1] = temp[j]; j--;
        }
        temp[j+1] = key;
    }
    int len = strlen(keyword), lo = 0, hi = n - 1, first = -1;
    while (lo <= hi) {
        int mid = (lo + hi) / 2;
        if (strncasecmp(temp[mid]->name, keyword, len) < 0) lo = mid + 1;
        else { first = mid; hi = mid - 1; }
    }
    if (first == -1) return;
    for (int i = first; i < n && strncasecmp(temp[i]->name, keyword, len) == 0; i++)
        results[(*count)++] = temp[i];
}

/* ── SORTING ── */

/* 1. Bubble Sort — price asc — O(n²) */
void bubble_sort_price() {
    int n = total_products;
    for (int i = 0; i < n - 1; i++)
        for (int j = 0; j < n - i - 1; j++)
            if (catalog[j].active && catalog[j+1].active &&
                catalog[j].price > catalog[j+1].price) {
                Product tmp = catalog[j]; catalog[j] = catalog[j+1]; catalog[j+1] = tmp;
            }
}

/* 2. Selection Sort — rating desc — O(n²) */
void selection_sort_rating() {
    int n = total_products;
    for (int i = 0; i < n - 1; i++) {
        int max_idx = i;
        for (int j = i + 1; j < n; j++)
            if (catalog[j].active && catalog[max_idx].active &&
                catalog[j].rating > catalog[max_idx].rating) max_idx = j;
        if (max_idx != i) {
            Product tmp = catalog[i]; catalog[i] = catalog[max_idx]; catalog[max_idx] = tmp;
        }
    }
}

/* 3. Insertion Sort — name A-Z — O(n²) */
void insertion_sort_name() {
    int n = total_products;
    for (int i = 1; i < n; i++) {
        Product key = catalog[i]; int j = i - 1;
        while (j >= 0 && strcasecmp(catalog[j].name, key.name) > 0) {
            catalog[j+1] = catalog[j]; j--;
        }
        catalog[j+1] = key;
    }
}

/* 4. Quick Sort — price asc — O(n log n) */
static int partition(Product *arr[], int low, int high) {
    float pivot = arr[high]->price; int i = low - 1;
    for (int j = low; j < high; j++) {
        if (arr[j]->price <= pivot) {
            i++;
            Product *tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
        }
    }
    Product *tmp = arr[i+1]; arr[i+1] = arr[high]; arr[high] = tmp;
    return i + 1;
}

void quick_sort_price(Product *arr[], int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        quick_sort_price(arr, low, pi - 1);
        quick_sort_price(arr, pi + 1, high);
    }
}

/* 5. Merge Sort — rating desc — O(n log n) */
static void merge(Product *arr[], int left, int mid, int right) {
    int n1 = mid - left + 1, n2 = right - mid;
    Product **L = malloc(n1 * sizeof(Product*));
    Product **R = malloc(n2 * sizeof(Product*));
    for (int i = 0; i < n1; i++) L[i] = arr[left + i];
    for (int j = 0; j < n2; j++) R[j] = arr[mid + 1 + j];
    int i = 0, j = 0, k = left;
    while (i < n1 && j < n2) {
        if (L[i]->rating >= R[j]->rating) arr[k++] = L[i++];
        else arr[k++] = R[j++];
    }
    while (i < n1) arr[k++] = L[i++];
    while (j < n2) arr[k++] = R[j++];
    free(L); free(R);
}

void merge_sort_rating(Product *arr[], int left, int right) {
    if (left < right) {
        int mid = (left + right) / 2;
        merge_sort_rating(arr, left, mid);
        merge_sort_rating(arr, mid + 1, right);
        merge(arr, left, mid, right);
    }
}