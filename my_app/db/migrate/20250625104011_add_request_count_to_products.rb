class AddRequestCountToProducts < ActiveRecord::Migration[7.2]
  def change
    add_column :products, :request_count, :integer, default: 0
  end
end
