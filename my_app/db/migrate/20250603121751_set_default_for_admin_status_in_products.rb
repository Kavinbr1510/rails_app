class SetDefaultForAdminStatusInProducts < ActiveRecord::Migration[7.2]
  def change
    change_column_default :products, :admin_status, 0
  end
end
