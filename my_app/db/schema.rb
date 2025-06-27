# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.2].define(version: 2025_06_25_104011) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "active_storage_attachments", force: :cascade do |t|
    t.string "name", null: false
    t.string "record_type", null: false
    t.bigint "record_id", null: false
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.string "key", null: false
    t.string "filename", null: false
    t.string "content_type"
    t.text "metadata"
    t.string "service_name", null: false
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.datetime "created_at", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

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

  create_table "categories", force: :cascade do |t|
    t.string "name"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "products", force: :cascade do |t|
    t.string "product_name"
    t.integer "cost"
    t.bigint "seller_id", null: false
    t.integer "admin_status", default: 0
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "approved_by", default: 1
    t.bigint "category_id"
    t.string "image"
    t.boolean "visible"
    t.integer "request_count", default: 0
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

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "buyer_requests", "products"
  add_foreign_key "buyer_requests", "users", column: "approved_by"
  add_foreign_key "buyer_requests", "users", column: "buyer_id"
  add_foreign_key "products", "users", column: "approved_by"
  add_foreign_key "products", "users", column: "seller_id"
  add_foreign_key "users", "roles"
end
