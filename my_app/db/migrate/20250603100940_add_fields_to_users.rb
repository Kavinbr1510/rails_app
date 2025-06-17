class AddFieldsToUsers < ActiveRecord::Migration[7.2]
  def change
    add_column :users, :name, :string
    add_reference :users, :role, null: false, foreign_key: true
  end
end
