#include <stdio.h>
#include <stdlib.h>
#include "third_party/quickjs/quickjs.h"
#include "third_party/quickjs/quickjs-libc.h"

#define crash(err_fmt, ...) do { \
    fprintf(stderr, err_fmt, ##__VA_ARGS__); \
    exit(1); \
} while(0)

int main(void) {
    JSRuntime *rt = JS_NewRuntime();
    if (rt == NULL) crash("JS_NewRuntime failed");
    js_std_init_handlers(rt);

    JSContext *ctx = JS_NewContext(rt);
    if (ctx == NULL) crash("JS_NewContext failed");
    js_std_add_helpers(ctx, 0, NULL);

    const char source_code[] = "['Hello', 'from', 'QuickJS!'].join(' ')";
    JSValue js_ret_val = JS_Eval(ctx,
                                 source_code, sizeof(source_code) - 1,
                                 "<from "__FILE__">", JS_EVAL_TYPE_GLOBAL);
    if (JS_IsException(js_ret_val)) crash("JavaScript Exception");
    const char* s = JS_ToCString(ctx, js_ret_val);
    if (s == NULL) crash("JS_ToCString failed");
    printf("%s", s);

    js_std_free_handlers(rt);
    JS_FreeContext(ctx);
    JS_FreeRuntime(rt);
    return 0;
}

