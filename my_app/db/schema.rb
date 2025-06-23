

ActiveRecord::Schema[7.2].define(version: 2025_06_16_160521) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "buyer_requests", force: :cascade do |t|
    t.bigint "product_id", null: false
    t.bigint "buyer_id", null: false
    t.integer "status"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "approved_by"
    t.index ["approved_by"], name: "index_buyer_requests_on_approved_by"
    t.index ["buyer_id"], name: "index_buyer_requests_on_buyer_id"
    t.index ["product_id"], name: "index_buyer_requests_on_product_id"
  end

  create_table "products", force: :cascade do |t|
    t.string "product_name"
    t.integer "cost"
    t.bigint "seller_id", null: false
    t.integer "admin_status", default: 0
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "approved_by", default: 1
    t.index ["approved_by"], name: "index_products_on_approved_by"
    t.index ["seller_id"], name: "index_products_on_seller_id"
  end

  create_table "roles", force: :cascade do |t|
    t.string "name"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "email", null: false
    t.string "name"
    t.bigint "role_id", null: false
    t.string "password_digest"
    t.index ["email"], name: "index_users_on_email"
    t.index ["role_id"], name: "index_users_on_role_id"
  end

  add_foreign_key "buyer_requests", "products"
  add_foreign_key "buyer_requests", "users", column: "approved_by"
  add_foreign_key "buyer_requests", "users", column: "buyer_id"
  add_foreign_key "products", "users", column: "approved_by"
  add_foreign_key "products", "users", column: "seller_id"
  add_foreign_key "users", "roles"
end
