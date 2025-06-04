class AddApprovedByToBuyerRequests < ActiveRecord::Migration[7.2]
  def change
    add_column :buyer_requests, :approved_by, :bigint
    add_index :buyer_requests, :approved_by
    add_foreign_key :buyer_requests, :users, column: :approved_by
  end
end
