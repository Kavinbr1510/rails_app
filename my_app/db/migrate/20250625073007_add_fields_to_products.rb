class AddFieldsToProducts < ActiveRecord::Migration[7.2]
  def change
    add_column :products, :category_id, :bigint
    add_column :products, :image, :string
    add_column :products, :visible, :boolean
  end
end
