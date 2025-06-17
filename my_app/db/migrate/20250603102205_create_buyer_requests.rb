class CreateBuyerRequests < ActiveRecord::Migration[7.2]
  def change
    create_table :buyer_requests do |t|
      t.references :product, null: false, foreign_key: true
      t.references :buyer, null: false, foreign_key: { to_table: :users }
      t.integer :status

      t.timestamps
    end
  end
end
