class CreateProducts < ActiveRecord::Migration[7.2]
  def change
    create_table :products do |t|
      t.string :product_name
      t.integer :cost
      t.references :seller, null: false, foreign_key: { to_table: :users }
      t.integer :admin_status

      t.timestamps
    end
  end
end
