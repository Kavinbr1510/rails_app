class AddApprovedByToProducts < ActiveRecord::Migration[6.1]
  def change
    add_column :products, :approved_by, :bigint, default: 1
    add_index :products, :approved_by
    add_foreign_key :products, :users, column: :approved_by
  end
end
