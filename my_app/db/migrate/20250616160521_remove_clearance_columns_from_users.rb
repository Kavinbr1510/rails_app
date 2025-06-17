class RemoveClearanceColumnsFromUsers < ActiveRecord::Migration[7.2]
  def change
    remove_column :users, :remember_token, :string
    remove_column :users, :confirmation_token, :string
  end
end
