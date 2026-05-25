#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include "product.h"

void clear_screen() {
#ifdef _WIN32
    system("cls");
#else
    system("clear");
#endif
}

void pause_screen() {
    printf("\nPress ENTER to continue...");
    while (getchar() != '\n');
    getchar();
}

void print_header(const char *title) {
    printf("====================\n");
    printf("=========\n");
    printf("==== E-COMMERCE PRODUCT SEARCH SYSTEM (ADA)   ==========     \n");
    printf("===================\n");
    printf(" ====== %-52s -===== \n", title);
    printf("=========================\n\n");
}

void flush_input() {
    int c;
    while ((c = getchar()) != '\n' && c != EOF);
}

float get_float(const char *prompt, float min, float max) {
    float val;
    while (1) {
        printf("%s", prompt);
        if (scanf("%f", &val) == 1 && val >= min && val <= max) {
            flush_input(); return val;
        }
        printf("  [!] Enter a number between %.1f and %.1f\n", min, max);
        flush_input();
    }
}

int get_int(const char *prompt) {
    int val;
    printf("%s", prompt);
    scanf("%d", &val);
    flush_input();
    return val;
}

void get_string(const char *prompt, char *buf, int maxlen) {
    printf("%s", prompt);
    fgets(buf, maxlen, stdin);
    buf[strcspn(buf, "\n")] = '\0';
}

/* ── ADD ── */
void menu_add_product() {
    clear_screen(); print_header("ADD NEW PRODUCT");
    char name[MAX_NAME_LEN];
    get_string("  Product Name  : ", name, MAX_NAME_LEN);
    if (strlen(name) == 0) { printf("  [!] Name cannot be empty.\n"); pause_screen(); return; }
    float price  = get_float("  Price (INR)   : ", 0, 1000000);
    float rating = get_float("  Rating (0-5)  : ", 0, 5);
    int id = add_product(name, price, rating);
    if (id > 0) printf("\n  [OK] Product added! ID: %d\n", id);
    else        printf("\n  [!] Failed to add product.\n");
    pause_screen();
}

/* ── VIEW ALL ── */
void menu_view_all() {
    clear_screen(); print_header("ALL PRODUCTS");
    display_all();
    pause_screen();
}

/* ── UPDATE ── */
void menu_update_product() {
    clear_screen(); print_header("UPDATE PRODUCT");
    int id = get_int("  Enter Product ID to update: ");
    Product *p = find_by_id(id);
    if (!p) { printf("  [!] ID %d not found.\n", id); pause_screen(); return; }

    printf("\n  Current: "); display_product(p); printf("\n");

    char name[MAX_NAME_LEN];
    printf("  New Name [%s]: ", p->name);
    fgets(name, MAX_NAME_LEN, stdin);
    name[strcspn(name, "\n")] = '\0';

    float price = p->price, rating = p->rating;
    char buf[32];

    printf("  New Price [%.2f]: ", p->price);
    fgets(buf, 32, stdin);
    if (buf[0] != '\n' && strlen(buf) > 1) price = atof(buf);

    printf("  New Rating [%.1f]: ", p->rating);
    fgets(buf, 32, stdin);
    if (buf[0] != '\n' && strlen(buf) > 1) {
        float r = atof(buf);
        if (r < 0 || r > 5) { printf("  [!] Rating must be 0-5.\n"); pause_screen(); return; }
        rating = r;
    }

    if (strlen(name) == 0) strncpy(name, p->name, MAX_NAME_LEN);

    if (update_product(id, name, price, rating))
        printf("\n  [OK] Product updated successfully!\n");
    else
        printf("\n  [!] Update failed.\n");
    pause_screen();
}

/* ── DELETE ── */
void menu_delete_product() {
    clear_screen(); print_header("DELETE PRODUCT");
    int id = get_int("  Enter Product ID to delete: ");
    Product *p = find_by_id(id);
    if (!p) { printf("  [!] ID %d not found.\n", id); pause_screen(); return; }
    printf("\n  Product: %s (Rs.%.2f, %.1f stars)\n", p->name, p->price, p->rating);
    printf("  Confirm delete? (y/n): ");
    char c = getchar(); flush_input();
    if (c == 'y' || c == 'Y') {
        if (delete_product(id)) printf("  [OK] Deleted successfully.\n");
        else printf("  [!] Deletion failed.\n");
    } else {
        printf("  Cancelled.\n");
    }
    pause_screen();
}

/* ── SEARCH ── */
void menu_search() {
    clear_screen(); print_header("SEARCH PRODUCTS");
    printf("  [1] Linear Search  — keyword in name  O(n)\n");
    printf("  [2] Binary Search  — name prefix       O(log n)\n");
    printf("  [3] Binary Search  — by Product ID     O(log n)\n");
    printf("  [0] Back\n\n");
    int choice = get_int("  Choose: ");
    Product *results[MAX_PRODUCTS]; int count = 0;

    if (choice == 1) {
        char kw[MAX_NAME_LEN];
        get_string("  Keyword: ", kw, MAX_NAME_LEN);
        printf("\n  [Linear Search] scanning for \"%s\"...\n\n", kw);
        linear_search(kw, results, &count);
    } else if (choice == 2) {
        char kw[MAX_NAME_LEN];
        get_string("  Name prefix: ", kw, MAX_NAME_LEN);
        printf("\n  [Binary Search] prefix \"%s\"...\n\n", kw);
        binary_search_by_name(kw, results, &count);
    } else if (choice == 3) {
        int id = get_int("  Product ID: ");
        printf("\n  [Binary Search] ID %d...\n\n", id);
        Product *p = binary_search_by_id(id);
        if (p) { results[0] = p; count = 1; }
    } else { return; }

    if (count == 0) {
        printf("  No products found.\n");
    } else {
        printf("  Found %d result(s):\n\n", count);
        print_separator();
        printf("| %-6s | %-28s | %-8s | %-6s |\n","ID","Product Name","Price","Rating");
        print_separator();
        for (int i = 0; i < count; i++) display_product(results[i]);
        print_separator();
    }
    pause_screen();
}

/* ── SORT ── */
void menu_sort() {
    clear_screen(); print_header("SORT PRODUCTS");
    printf("  [1] Bubble Sort    — Price  asc   O(n^2)\n");
    printf("  [2] Selection Sort — Rating desc  O(n^2)\n");
    printf("  [3] Insertion Sort — Name   A-Z   O(n^2)\n");
    printf("  [4] Quick Sort     — Price  asc   O(n log n)\n");
    printf("  [5] Merge Sort     — Rating desc  O(n log n)\n");
    printf("  [0] Back\n\n");
    int choice = get_int("  Choose: ");
    if (choice == 0) return;

    Product *arr[MAX_PRODUCTS]; int n = 0;
    for (int i = 0; i < total_products; i++)
        if (catalog[i].active) arr[n++] = &catalog[i];

    switch (choice) {
        case 1: bubble_sort_price();    printf("\n  [OK] Bubble Sort done.\n\n");    display_all(); break;
        case 2: selection_sort_rating();printf("\n  [OK] Selection Sort done.\n\n"); display_all(); break;
        case 3: insertion_sort_name();  printf("\n  [OK] Insertion Sort done.\n\n"); display_all(); break;
        case 4:
            quick_sort_price(arr, 0, n - 1);
            printf("\n  [OK] Quick Sort done.\n\n");
            print_separator();
            printf("| %-6s | %-28s | %-8s | %-6s |\n","ID","Name","Price","Rating");
            print_separator();
            for (int i = 0; i < n; i++) display_product(arr[i]);
            print_separator();
            break;
        case 5:
            merge_sort_rating(arr, 0, n - 1);
            printf("\n  [OK] Merge Sort done.\n\n");
            print_separator();
            printf("| %-6s | %-28s | %-8s | %-6s |\n","ID","Name","Price","Rating");
            print_separator();
            for (int i = 0; i < n; i++) display_product(arr[i]);
            print_separator();
            break;
        default: printf("  [!] Invalid choice.\n");
    }
    pause_screen();
}

/* ── SEED DATA ── */
void seed_data() {
    if (total_products > 0) return;
    add_product("Nike Air Zoom Running Shoes",  4999.00f, 4.5f);
    add_product("Adidas Ultraboost 22",         6499.00f, 4.3f);
    add_product("Puma Running Pro Shoes",       3299.00f, 4.1f);
    add_product("Reebok Floatride Energy",      5199.00f, 3.9f);
    add_product("Samsung Galaxy S24 Ultra",    89999.00f, 4.7f);
    add_product("Apple iPhone 15 Pro",         99999.00f, 4.8f);
    add_product("OnePlus 12 5G",               64999.00f, 4.4f);
    add_product("Sony WH-1000XM5 Headphones",  29999.00f, 4.6f);
    add_product("Boat Airdopes 141",            1499.00f, 3.8f);
    add_product("Dell Inspiron 15 Laptop",     55000.00f, 4.2f);
    printf("  [OK] 10 demo products loaded.\n\n");
}

/* ── MAIN ── */
int main() {
    load_products();
    seed_data();
    int choice;
    do {
        clear_screen(); print_header("MAIN MENU");
        printf("  [1]  Add New Product\n");
        printf("  [2]  View All Products\n");
        printf("  [3]  Update Product\n");
        printf("  [4]  Delete Product\n");
        printf("  [5]  Search Products\n");
        printf("  [6]  Sort Products\n");
        printf("  [0]  Exit\n\n");
        choice = get_int("  Enter choice: ");
        switch (choice) {
            case 1: menu_add_product();    break;
            case 2: menu_view_all();       break;
            case 3: menu_update_product(); break;
            case 4: menu_delete_product(); break;
            case 5: menu_search();         break;
            case 6: menu_sort();           break;
            case 0: printf("\n  Goodbye!\n\n"); break;
            default: printf("  [!] Invalid.\n"); pause_screen();
        }
    } while (choice != 0);
    return 0;
}