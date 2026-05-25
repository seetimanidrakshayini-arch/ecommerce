#ifndef PRODUCT_H
#define PRODUCT_H
 
#define MAX_PRODUCTS 1000
#define MAX_NAME_LEN 100
#define DATA_FILE "products.dat"
 
typedef struct {
    int    id;
    char   name[MAX_NAME_LEN];
    float  price;
    float  rating;
    int    active;
} Product;
 
extern Product catalog[MAX_PRODUCTS];
extern int     total_products;
 
void     load_products();
void     save_products();
int      add_product(const char *name, float price, float rating);
int      update_product(int id, const char *name, float price, float rating);
int      delete_product(int id);
Product *find_by_id(int id);
 
void     linear_search(const char *keyword, Product *results[], int *count);
void     binary_search_by_name(const char *keyword, Product *results[], int *count);
Product *binary_search_by_id(int id);
 
void     bubble_sort_price();
void     selection_sort_rating();
void     insertion_sort_name();
void     quick_sort_price(Product *arr[], int low, int high);
void     merge_sort_rating(Product *arr[], int left, int right);
 
void     display_all();
void     display_product(const Product *p);
void     print_separator();
 
#endif
 